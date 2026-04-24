/**
 * Type declarations for the `smpp` npm package (node-smpp)
 * Covers the subset of the API used by TelvoiceSMS.
 */

declare module 'smpp' {
  import { EventEmitter } from 'events'
  import { Socket } from 'net'

  // -------------------------------------------------------
  // PDU
  // -------------------------------------------------------
  export interface PDU {
    command: string
    command_status: number
    sequence_number: number
    // bind fields
    system_id?: string
    password?: string
    system_type?: string
    bind_mode?: 'receiver' | 'transmitter' | 'transceiver'
    // submit_sm / deliver_sm fields
    source_addr?: string
    destination_addr?: string
    short_message?: Buffer | string
    data_coding?: number
    registered_delivery?: number
    source_addr_ton?: number
    source_addr_npi?: number
    dest_addr_ton?: number
    dest_addr_npi?: number
    validity_period?: string
    // deliver_sm_resp / submit_sm_resp
    message_id?: string
    // message_state (DLR)
    message_state?: number
    receipted_message_id?: string
    // generic nack
    [key: string]: unknown
    response(options?: Partial<PDU>): PDU
  }

  // -------------------------------------------------------
  // Session (used both for server sessions and client sessions)
  // -------------------------------------------------------
  export interface Session extends EventEmitter {
    readonly remoteAddress: string | undefined
    readonly remotePort: number | undefined
    readonly socket: Socket

    send(pdu: PDU): void
    pause(): void
    resume(): void
    close(): void
    destroy(): void
    bind_receiver(params: Partial<PDU>, callback: (pdu: PDU) => void): void
    bind_transmitter(params: Partial<PDU>, callback: (pdu: PDU) => void): void
    bind_transceiver(params: Partial<PDU>, callback: (pdu: PDU) => void): void

    on(event: 'connect', listener: () => void): this
    on(event: 'bind_transceiver', listener: (pdu: PDU) => void): this
    on(event: 'bind_transmitter', listener: (pdu: PDU) => void): this
    on(event: 'bind_receiver', listener: (pdu: PDU) => void): this
    on(event: 'submit_sm', listener: (pdu: PDU) => void): this
    on(event: 'submit_sm_resp', listener: (pdu: PDU) => void): this
    on(event: 'deliver_sm', listener: (pdu: PDU) => void): this
    on(event: 'enquire_link', listener: (pdu: PDU) => void): this
    on(event: 'unbind', listener: (pdu: PDU) => void): this
    on(event: 'error', listener: (err: Error) => void): this
    on(event: 'close', listener: () => void): this
    on(event: string, listener: (...args: unknown[]) => void): this
  }

  // -------------------------------------------------------
  // Server
  // -------------------------------------------------------
  export interface ServerOptions {
    enable_enquire_link_resp?: boolean
    auto_enquire_link_period?: number
  }

  export class Server extends EventEmitter {
    constructor(options?: ServerOptions, listener?: (session: Session) => void)
    listen(port: number, host?: string, callback?: () => void): this
    close(callback?: () => void): void
    on(event: 'session', listener: (session: Session) => void): this
    on(event: 'error', listener: (err: Error) => void): this
    on(event: string, listener: (...args: unknown[]) => void): this
  }

  // -------------------------------------------------------
  // Client (outbound connection to vendor)
  // -------------------------------------------------------
  export interface ConnectOptions {
    host: string
    port: number
    auto_enquire_link_period?: number
    reconnect?: number
  }

  export function connect(options: ConnectOptions): Session

  // -------------------------------------------------------
  // PDU helpers
  // -------------------------------------------------------
  export function createPDU(command: string, options?: Partial<PDU>): PDU

  // -------------------------------------------------------
  // Command status codes
  // -------------------------------------------------------
  export const ESME_ROK: number
  export const ESME_RINVPASWD: number
  export const ESME_RINVSYSID: number
  export const ESME_RBINDFAIL: number
  export const ESME_RTHROTTLED: number
  export const ESME_RINVDSTADR: number

  // -------------------------------------------------------
  // Message states (DLR)
  // -------------------------------------------------------
  export const MESSAGE_STATES: {
    ENROUTE: number
    DELIVERED: number
    EXPIRED: number
    DELETED: number
    UNDELIVERABLE: number
    ACCEPTED: number
    UNKNOWN: number
    REJECTED: number
  }
}
