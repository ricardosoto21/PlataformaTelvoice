/**
 * Message Processor — receives submit_sm from the SMPP server and enqueues
 * it to the outbound queue for async processing.
 */

import { v4 as uuidv4 } from 'uuid'
import type { PDU } from 'smpp'
import { getOutboundQueue } from './queues/queue-manager'
import type { SMPPOutboundJob } from './queues/job-types'

export class MessageProcessor {
  private static instance: MessageProcessor

  static getInstance(): MessageProcessor {
    if (!MessageProcessor.instance) {
      MessageProcessor.instance = new MessageProcessor()
    }
    return MessageProcessor.instance
  }

  async enqueueOutbound(pdu: PDU, customerId: string, sessionId: string): Promise<string> {
    const externalId = uuidv4()

    const shortMessage = pdu.short_message instanceof Buffer
      ? pdu.short_message.toString('utf8')
      : (pdu.short_message as string | undefined) ?? ''

    const jobData: SMPPOutboundJob = {
      sourceAddr: pdu.source_addr ?? '',
      destAddr: pdu.destination_addr ?? '',
      shortMessage,
      dataCoding: pdu.data_coding ?? 0,
      registeredDelivery: pdu.registered_delivery ?? 0,
      customerId,
      sessionId,
      externalId,
      attemptNumber: 1,
    }

    const queue = getOutboundQueue()
    if (!queue) {
      throw new Error('[message-processor] Redis unavailable — cannot enqueue outbound message')
    }
    await queue.add('submit_sm', jobData, {
      jobId: externalId,
    })

    return externalId
  }
}
