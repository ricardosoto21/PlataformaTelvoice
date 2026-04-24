/**
 * BullMQ job payload types for the SMPP engine queues.
 */

export interface SMPPOutboundJob {
  // SMPP PDU fields
  sourceAddr: string
  destAddr: string
  shortMessage: string
  dataCoding: number
  registeredDelivery: number
  // Context
  customerId: string
  sessionId: string
  externalId: string       // Message ID returned to the client
  // Destination info (filled by message processor)
  mcc?: string
  mnc?: string
  country?: string
  operator?: string
  // Routing (filled by LCR)
  vendorId?: string
  routeId?: string
  vendorRate?: number
  customerRate?: number
  // Retry context
  attemptNumber?: number
}

export interface SMPPDLRJob {
  vendorMsgId: string
  internalMsgId: string
  customerId: string
  sessionId: string
  messageState: number
  sourceAddr: string
  destAddr: string
  shortMessage?: string
  customerRate: number
}

export interface SMPPBillingJob {
  customerId: string
  messageId: string
  amount: number
  description?: string
}
