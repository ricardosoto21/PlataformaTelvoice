/**
 * SMS Outbound Worker
 * Processes submit_sm jobs: applies content rules, LCR, sends to vendor, saves to DB.
 */

import { Worker } from 'bullmq'
import { getRedisConnection, QUEUE_NAMES, hasRedis } from './queue-manager'
import { LCREngine } from '../lcr-engine'
import { BillingEngine } from '../billing-engine'
import { SMPPClientManager } from '../smpp-client'
import { getEngineDb } from '../db'
import type { SMPPOutboundJob } from './job-types'

const lcr = LCREngine.getInstance()
const billing = BillingEngine.getInstance()
const clientManager = SMPPClientManager.getInstance()

export function startOutboundWorker(): Worker<SMPPOutboundJob> | null {
  const conn = getRedisConnection()
  if (!conn) {
    console.warn('[worker:outbound] Redis not available — outbound worker disabled')
    return null
  }

  const worker = new Worker<SMPPOutboundJob>(
    QUEUE_NAMES.SMS_OUTBOUND,
    async (job) => {
      const data = job.data
      console.log(`[worker:outbound] Processing job ${job.id} for ${data.destAddr}`)

      // ------------------------------------------------
      // 1. Detect MCC/MNC from destination (lookup table)
      // ------------------------------------------------
      const destination = await resolveMccMnc(data.destAddr)
      const mcc = destination?.mcc ?? ''
      const mnc = destination?.mnc ?? ''
      const country = destination?.country ?? ''
      const operator = destination?.operator ?? ''

      // ------------------------------------------------
      // 2. Block list check
      // ------------------------------------------------
      const blocked = await checkBlockLists(data.customerId, data.destAddr, data.sourceAddr, data.shortMessage)
      if (blocked) {
        console.warn(`[worker:outbound] Message blocked for ${data.destAddr}: ${blocked}`)
        await billing.saveMessage({
          externalId: data.externalId,
          customerId: data.customerId,
          sourceAddr: data.sourceAddr,
          destAddr: data.destAddr,
          messageText: data.shortMessage,
          mcc, mnc, country, operator,
          status: 'REJECTED',
          customerRate: 0,
          vendorRate: 0,
          profit: 0,
        })
        return { status: 'REJECTED', reason: blocked }
      }

      // ------------------------------------------------
      // 3. Content translation (customer-level)
      // ------------------------------------------------
      const translatedMessage = await applyContentTranslations(data.shortMessage, data.customerId)

      // ------------------------------------------------
      // 4. Get customer rate
      // ------------------------------------------------
      const customerRate = await billing.getCustomerRate(data.customerId, mcc, mnc)

      // ------------------------------------------------
      // 5. LCR — find best vendor
      // ------------------------------------------------
      const route = await lcr.findRoute({
        customerId: data.customerId,
        mcc,
        mnc,
        sourceAddr: data.sourceAddr,
      })

      if (!route) {
        console.error(`[worker:outbound] No route for MCC ${mcc} MNC ${mnc}`)
        await billing.saveMessage({
          externalId: data.externalId,
          customerId: data.customerId,
          sourceAddr: data.sourceAddr,
          destAddr: data.destAddr,
          messageText: translatedMessage,
          mcc, mnc, country, operator,
          status: 'FAILED',
          customerRate,
          vendorRate: 0,
          profit: -customerRate,
        })
        throw new Error(`No route available for MCC ${mcc} MNC ${mnc}`)
      }

      const vendorRate = route.vendorRate
      const profit = customerRate - vendorRate

      // ------------------------------------------------
      // 6. Save message to DB (status: SUBMITTED)
      // ------------------------------------------------
      const internalId = await billing.saveMessage({
        externalId: data.externalId,
        customerId: data.customerId,
        vendorId: route.vendorId,
        routeId: route.routeId,
        sourceAddr: data.sourceAddr,
        destAddr: data.destAddr,
        messageText: translatedMessage,
        mcc, mnc, country, operator,
        status: 'SUBMITTED',
        customerRate,
        vendorRate,
        profit,
      })

      // ------------------------------------------------
      // 7. Send to vendor
      // ------------------------------------------------
      const result = await clientManager.submitToVendor(route.vendorId, {
        sourceAddr: data.sourceAddr,
        destAddr: data.destAddr,
        shortMessage: translatedMessage,
        dataCoding: data.dataCoding,
      })

      if (!result.success) {
        console.error(`[worker:outbound] Vendor submit failed: ${result.error}`)
        if (internalId) {
          await billing.updateMessageStatus({
            messageId: internalId,
            status: 'FAILED',
            errorCode: 'VENDOR_ERROR',
          })
        }
        throw new Error(result.error ?? 'Vendor submit failed')
      }

      // Update message with vendor's message_id (for DLR matching)
      if (internalId && result.messageId) {
        const db = getEngineDb()
        await db
          .from('messages')
          .update({ external_id: result.messageId, sent_at: new Date().toISOString() })
          .eq('id', internalId)
      }

      console.log(`[worker:outbound] Job ${job.id} done → vendor msg_id: ${result.messageId}`)
      return { status: 'SUBMITTED', vendorMsgId: result.messageId, internalId }
    },
    {
      connection: conn,
      concurrency: 50,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[worker:outbound] Job ${job?.id} failed:`, err.message)
  })

  return worker
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
async function resolveMccMnc(destAddr: string): Promise<{
  mcc: string; mnc: string; country: string; operator: string
} | null> {
  // Strip non-digits and leading +
  const digits = destAddr.replace(/\D/g, '')
  if (digits.length < 5) return null

  const db = getEngineDb()

  // Try MCC+MNC prefixes (3+2 or 3+3 digit)
  for (const mncLen of [3, 2]) {
    const mcc = digits.slice(0, 3)
    const mnc = digits.slice(3, 3 + mncLen)

    const { data } = await db
      .from('mcc_mnc')
      .select('mcc, mnc, country, operator')
      .eq('mcc', mcc)
      .eq('mnc', mnc)
      .single()

    if (data) return data
  }
  return null
}

async function checkBlockLists(
  customerId: string,
  destAddr: string,
  sourceAddr: string,
  message: string,
): Promise<string | null> {
  const db = getEngineDb()

  const { data: rules } = await db
    .from('block_lists')
    .select('type, value')
    .eq('active', true)
    .or(`scope.eq.GLOBAL,and(scope.eq.CUSTOMER,customer_id.eq.${customerId})`)

  if (!rules) return null

  for (const rule of rules) {
    if (rule.type === 'NUMBER' && destAddr === rule.value) return `Blocked number: ${rule.value}`
    if (rule.type === 'SENDER_ID' && sourceAddr === rule.value) return `Blocked sender: ${rule.value}`
    if (rule.type === 'KEYWORD' && message.toLowerCase().includes(rule.value.toLowerCase())) return `Blocked keyword: ${rule.value}`
    if (rule.type === 'REGEX') {
      try {
        if (new RegExp(rule.value).test(message)) return `Blocked by regex: ${rule.value}`
      } catch {}
    }
  }
  return null
}

async function applyContentTranslations(message: string, customerId: string): Promise<string> {
  const db = getEngineDb()

  const { data: rules } = await db
    .from('content_translations')
    .select('match_type, source_text, target_text, case_sensitive')
    .eq('active', true)
    .or(`scope.eq.GLOBAL,and(scope.eq.CUSTOMER,customer_id.eq.${customerId})`)
    .order('priority', { ascending: false })

  if (!rules) return message

  let result = message
  for (const rule of rules) {
    const flags = rule.case_sensitive ? 'g' : 'gi'
    try {
      if (rule.match_type === 'EXACT') {
        if (rule.case_sensitive ? result === rule.source_text : result.toLowerCase() === rule.source_text.toLowerCase()) {
          result = rule.target_text
        }
      } else if (rule.match_type === 'CONTAINS') {
        result = result.replace(new RegExp(escapeRegex(rule.source_text), flags), rule.target_text)
      } else if (rule.match_type === 'REGEX') {
        result = result.replace(new RegExp(rule.source_text, flags), rule.target_text)
      } else if (rule.match_type === 'STARTS_WITH' && result.toLowerCase().startsWith(rule.source_text.toLowerCase())) {
        result = rule.target_text + result.slice(rule.source_text.length)
      } else if (rule.match_type === 'ENDS_WITH' && result.toLowerCase().endsWith(rule.source_text.toLowerCase())) {
        result = result.slice(0, -rule.source_text.length) + rule.target_text
      }
    } catch {}
  }
  return result
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
