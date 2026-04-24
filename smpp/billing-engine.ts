/**
 * Billing Engine — handles balance deduction and transaction recording.
 * Called after confirmed delivery (DLR received) or on submit depending on config.
 */

import { getEngineDb } from './db'

export class BillingEngine {
  private static instance: BillingEngine

  static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine()
    }
    return BillingEngine.instance
  }

  /**
   * Get customer rate for a given MCC/MNC from their assigned rate plan.
   */
  async getCustomerRate(customerId: string, mcc: string, mnc: string): Promise<number> {
    const db = getEngineDb()

    const { data: customer } = await db
      .from('customers')
      .select('rate_plan_id')
      .eq('id', customerId)
      .single()

    if (!customer?.rate_plan_id) return 0

    const { data: rate } = await db
      .from('rate_plan_rates')
      .select('rate')
      .eq('rate_plan_id', customer.rate_plan_id)
      .eq('mcc', mcc)
      .eq('mnc', mnc)
      .single()

    if (!rate) {
      // Try MCC-only (wildcard MNC)
      const { data: wildcardRate } = await db
        .from('rate_plan_rates')
        .select('rate')
        .eq('rate_plan_id', customer.rate_plan_id)
        .eq('mcc', mcc)
        .is('mnc', null)
        .single()

      return wildcardRate?.rate ?? 0
    }

    return rate.rate
  }

  /**
   * Deduct balance from customer and record the transaction.
   * Returns true if deduction succeeded (sufficient balance), false otherwise.
   */
  async deductBalance(params: {
    customerId: string
    messageId: string
    amount: number
    description?: string
  }): Promise<boolean> {
    const db = getEngineDb()

    const { data: customer } = await db
      .from('customers')
      .select('balance, credit_limit')
      .eq('id', params.customerId)
      .single()

    if (!customer) return false

    const availableBalance = (customer.balance ?? 0) + (customer.credit_limit ?? 0)
    if (availableBalance < params.amount) {
      console.warn(`[billing] Insufficient balance for customer ${params.customerId}`)
      return false
    }

    const newBalance = (customer.balance ?? 0) - params.amount

    // Update balance
    const { error: updateError } = await db
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', params.customerId)

    if (updateError) {
      console.error('[billing] Failed to update balance:', updateError)
      return false
    }

    // Record transaction
    await db.from('balance_transactions').insert({
      customer_id: params.customerId,
      type: 'DEBIT',
      amount: -params.amount,
      currency: 'USD',
      description: params.description ?? `SMS charge - ${params.messageId}`,
      balance_before: customer.balance,
      balance_after: newBalance,
      reference_id: params.messageId,
    })

    return true
  }

  /**
   * Save message record to the messages table.
   */
  async saveMessage(msg: {
    externalId?: string
    customerId: string
    vendorId?: string
    routeId?: string
    smppAccountId?: string
    sourceAddr: string
    destAddr: string
    messageText?: string
    encoding?: string
    messageParts?: number
    mcc?: string
    mnc?: string
    country?: string
    operator?: string
    status: string
    customerRate: number
    vendorRate: number
    profit: number
    currency?: string
  }): Promise<string | null> {
    const db = getEngineDb()

    const { data, error } = await db
      .from('messages')
      .insert({
        external_id: msg.externalId,
        customer_id: msg.customerId,
        vendor_id: msg.vendorId,
        route_id: msg.routeId,
        smpp_account_id: msg.smppAccountId,
        source_addr: msg.sourceAddr,
        dest_addr: msg.destAddr,
        message_text: msg.messageText,
        encoding: msg.encoding ?? 'GSM',
        message_parts: msg.messageParts ?? 1,
        mcc: msg.mcc,
        mnc: msg.mnc,
        country: msg.country,
        operator: msg.operator,
        status: msg.status,
        customer_rate: msg.customerRate,
        vendor_rate: msg.vendorRate,
        profit: msg.profit,
        currency: msg.currency ?? 'USD',
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[billing] Failed to save message:', error)
      return null
    }

    return data.id
  }

  /**
   * Update message status (e.g., after DLR received).
   */
  async updateMessageStatus(params: {
    messageId: string
    status: string
    dlrStatus?: string
    errorCode?: string
    deliveredAt?: string
  }): Promise<void> {
    const db = getEngineDb()

    await db
      .from('messages')
      .update({
        status: params.status,
        dlr_status: params.dlrStatus,
        error_code: params.errorCode,
        delivered_at: params.deliveredAt,
        dlr_received_at: new Date().toISOString(),
      })
      .eq('id', params.messageId)
  }
}
