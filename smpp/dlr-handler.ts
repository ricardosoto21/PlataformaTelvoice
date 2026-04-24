/**
 * DLR Handler — processes delivery receipts from vendors and forwards to the
 * originating customer session.
 */

import type { PDU } from 'smpp'
import { getEngineDb } from './db'
import { SessionManager } from './session-manager'
import { BillingEngine } from './billing-engine'
import { v4 as uuidv4 } from 'uuid'

const sessionManager = SessionManager.getInstance()
const billing = BillingEngine.getInstance()

// Map: vendor_message_id -> { internalMessageId, sessionId, customerId, customerRate, sequence }
const pendingDLRs = new Map<string, {
  internalMessageId: string
  sessionId: string
  customerId: string
  customerRate: number
  sourceAddr: string
  destAddr: string
}>()

export class DLRHandler {
  private static instance: DLRHandler

  static getInstance(): DLRHandler {
    if (!DLRHandler.instance) {
      DLRHandler.instance = new DLRHandler()
    }
    return DLRHandler.instance
  }

  /**
   * Register a pending DLR lookup after submit.
   */
  registerPendingDLR(vendorMessageId: string, data: {
    internalMessageId: string
    sessionId: string
    customerId: string
    customerRate: number
    sourceAddr: string
    destAddr: string
  }): void {
    pendingDLRs.set(vendorMessageId, data)
  }

  /**
   * Process an incoming deliver_sm from a vendor.
   * Could be a DLR (status report) or an MO (mobile-originated message).
   */
  async handleDLR(pdu: PDU, vendorId: string): Promise<void> {
    const vendorMsgId = pdu.receipted_message_id ?? pdu.message_id ?? ''
    const msgState = pdu.message_state

    // Determine if this is a DLR (has receipted_message_id or message_state)
    const isDLR = !!pdu.receipted_message_id || msgState !== undefined

    if (isDLR) {
      await this.processDLR(pdu, vendorMsgId, vendorId)
    } else {
      await this.processMO(pdu, vendorId)
    }
  }

  private async processDLR(pdu: PDU, vendorMsgId: string, vendorId: string): Promise<void> {
    const db = getEngineDb()

    // Look up the original message in DB by vendor's message_id
    const { data: message } = await db
      .from('messages')
      .select('id, customer_id, customer_rate, status')
      .eq('external_id', vendorMsgId)
      .single()

    if (!message) {
      // Try pending map
      const pending = pendingDLRs.get(vendorMsgId)
      if (!pending) {
        console.warn(`[dlr] DLR for unknown message: ${vendorMsgId}`)
        return
      }
      await this.deliverDLRToClient(pdu, pending.sessionId, pending.internalMessageId)
      await billing.deductBalance({
        customerId: pending.customerId,
        messageId: pending.internalMessageId,
        amount: pending.customerRate,
        description: `SMS delivered to ${pending.destAddr}`,
      })
      pendingDLRs.delete(vendorMsgId)
      return
    }

    // Determine final status
    const delivered = pdu.message_state === 1 // DELIVERED
    const failed = pdu.message_state === 5 || pdu.message_state === 8 // UNDELIVERABLE | REJECTED
    const status = delivered ? 'DELIVERED' : failed ? 'FAILED' : 'SUBMITTED'

    // Update message in DB
    await billing.updateMessageStatus({
      messageId: message.id,
      status,
      dlrStatus: String(pdu.message_state ?? ''),
      deliveredAt: delivered ? new Date().toISOString() : undefined,
    })

    // Deduct on delivery
    if (delivered && message.customer_rate > 0) {
      await billing.deductBalance({
        customerId: message.customer_id,
        messageId: message.id,
        amount: message.customer_rate,
      })
    }

    // Forward DLR to originating client session
    const clientSessions = sessionManager.getAllClients().filter(
      s => s.customerId === message.customer_id
    )
    for (const cs of clientSessions) {
      try {
        cs.session.send({
          command: 'deliver_sm',
          sequence_number: Math.floor(Math.random() * 0x7fffffff),
          source_addr: pdu.source_addr ?? '',
          destination_addr: pdu.destination_addr ?? '',
          short_message: pdu.short_message ?? '',
          receipted_message_id: message.id,
          message_state: pdu.message_state,
        } as PDU)
        sessionManager.incrementClientMsgReceived(cs.sessionId)
      } catch (err) {
        console.error(`[dlr] Failed to forward DLR to client ${cs.systemId}:`, err)
      }
    }
  }

  private async deliverDLRToClient(
    pdu: PDU,
    sessionId: string,
    internalMessageId: string,
  ): Promise<void> {
    const cs = sessionManager.getClient(sessionId)
    if (!cs) return
    try {
      cs.session.send({
        command: 'deliver_sm',
        sequence_number: Math.floor(Math.random() * 0x7fffffff),
        source_addr: pdu.source_addr ?? '',
        destination_addr: pdu.destination_addr ?? '',
        short_message: pdu.short_message ?? '',
        receipted_message_id: internalMessageId,
        message_state: pdu.message_state,
      } as PDU)
      sessionManager.incrementClientMsgReceived(sessionId)
    } catch {}
  }

  private async processMO(pdu: PDU, vendorId: string): Promise<void> {
    // Mobile-originated: forward to all receiver/transceiver sessions of matching customer
    // For now just log — MO routing rules can be added later
    console.log(`[dlr] MO message from ${pdu.source_addr} via vendor ${vendorId}`)
  }
}
