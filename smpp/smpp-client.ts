/**
 * SMPP Client Manager — handles outbound connections to vendor SMPP endpoints.
 * Supports auto-reconnect, enquire_link keepalive, and DLR forwarding.
 */

import * as smpp from 'smpp'
import { v4 as uuidv4 } from 'uuid'
import { getEngineDb } from './db'
import { SessionManager } from './session-manager'
import { DLRHandler } from './dlr-handler'

const sessionManager = SessionManager.getInstance()

export interface SubmitResult {
  success: boolean
  messageId?: string
  error?: string
}

type VendorAccount = {
  id: string
  system_id: string
  password: string
  host: string
  port: number
  bind_mode: string
  vendor_id: string
  vendors: { id: string; name: string } | { id: string; name: string }[] | null
}

export class SMPPClientManager {
  private static instance: SMPPClientManager
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private manualDisconnects = new Set<string>()
  private pendingSubmits = new Map<
    string,
    Map<
      number,
      {
        timeout: ReturnType<typeof setTimeout>
        resolve: (result: SubmitResult) => void
      }
    >
  >()

  static getInstance(): SMPPClientManager {
    if (!SMPPClientManager.instance) {
      SMPPClientManager.instance = new SMPPClientManager()
    }
    return SMPPClientManager.instance
  }

  /**
   * Load all vendor SMPP accounts from DB and connect them.
   */
  async connectAllVendors(): Promise<void> {
    const db = getEngineDb()
    const { data: accounts } = await db
      .from('smpp_accounts')
      .select(`
        id, system_id, password, host, port, bind_mode, status, vendor_id,
        vendors ( id, name )
      `)
      .eq('type', 'VENDOR')
      .eq('status', 'ACTIVE')

    if (!accounts) return

    for (const account of accounts) {
      await this.connectVendor(account)
    }
  }

  async connectVendor(account: VendorAccount): Promise<void> {
    const vendorId = account.vendor_id
    const existing = sessionManager.getVendor(vendorId)
    const vendorRef = this.getVendorRef(account.vendors)

    this.manualDisconnects.delete(vendorId)

    if (existing?.status === 'connected') {
      console.log(`[smpp-client] Vendor ${vendorId} already connected`)
      return
    }

    // Register vendor in session manager if not present
    if (!existing) {
      sessionManager.addVendor({
        sessionId: uuidv4(),
        vendorId,
        vendorName: vendorRef?.name ?? vendorId,
        smppAccountId: account.id,
        host: account.host,
        port: account.port,
        systemId: account.system_id,
        bindMode: (account.bind_mode as 'transceiver' | 'transmitter' | 'receiver') ?? 'transceiver',
        session: null,
        connectedAt: null,
        reconnecting: false,
        msgSent: 0,
        msgReceived: 0,
        dlrReceived: 0,
        lastActivity: null,
        status: 'connecting',
      })
    } else {
      sessionManager.updateVendorStatus(vendorId, 'connecting')
    }

    this.doConnect(account)
  }

  private doConnect(account: VendorAccount): void {
    const vendorId = account.vendor_id
    const vendorRef = this.getVendorRef(account.vendors)

    try {
      const session = smpp.connect({
        host: account.host,
        port: account.port,
        auto_enquire_link_period: 30000,
        reconnect: 0, // we handle reconnect manually
      })

      // Bind on connect
      session.on('connect', () => {
        const bindParams = {
          system_id: account.system_id,
          password: account.password,
          system_type: 'VMA'
        }

        const handleBindResp = (pdu: smpp.PDU) => {
          if (pdu.command_status === 0) {
            sessionManager.updateVendorStatus(vendorId, 'connected', session)
            console.log(`[smpp-client] Vendor ${vendorRef?.name} (${account.host}) connected`)
            // Clear any pending reconnect timer
            if (this.reconnectTimers.has(vendorId)) {
              clearTimeout(this.reconnectTimers.get(vendorId))
              this.reconnectTimers.delete(vendorId)
            }
          } else {
            console.warn(`[smpp-client] Vendor bind failed: ${vendorRef?.name}, status: ${pdu.command_status}`)
            sessionManager.updateVendorStatus(vendorId, 'error', null)
            this.scheduleReconnect(account)
          }
        }

        // Usamos los métodos nativos seguros de node-smpp
        if (account.bind_mode === 'receiver') {
          session.bind_receiver(bindParams, handleBindResp)
        } else if (account.bind_mode === 'transmitter') {
          session.bind_transmitter(bindParams, handleBindResp)
        } else {
          session.bind_transceiver(bindParams, handleBindResp)
        }
      })
      // Incoming deliver_sm from vendor (DLR / MO)
      session.on('deliver_sm', async (pdu: smpp.PDU) => {
        sessionManager.incrementVendorDlrReceived(vendorId)
        session.send({
          command: 'deliver_sm_resp',
          command_status: 0,
          sequence_number: pdu.sequence_number,
          message_id: '',
        } as smpp.PDU)
        await DLRHandler.getInstance().handleDLR(pdu, vendorId)
      })

      session.on('submit_sm_resp', (respPdu: smpp.PDU) => {
        const pendingByVendor = this.pendingSubmits.get(vendorId)
        if (!pendingByVendor) return

        const sequenceNumber = respPdu.sequence_number
        const pending = pendingByVendor.get(sequenceNumber)
        if (!pending) return

        clearTimeout(pending.timeout)
        pendingByVendor.delete(sequenceNumber)

        if (pendingByVendor.size === 0) {
          this.pendingSubmits.delete(vendorId)
        }

        if (respPdu.command_status === 0) {
          sessionManager.incrementVendorMsgSent(vendorId)
          pending.resolve({ success: true, messageId: respPdu.message_id ?? uuidv4() })
          return
        }

        pending.resolve({
          success: false,
          error: `SMPP error code: ${respPdu.command_status}`,
        })
      })

      session.on('error', (err: Error) => {
        console.error(`[smpp-client] Vendor ${vendorRef?.name} error:`, err.message)
        sessionManager.updateVendorStatus(vendorId, 'error', null)
      })

      session.on('close', () => {
        this.rejectPendingSubmits(vendorId, 'Vendor connection closed')
        console.log(`[smpp-client] Vendor ${vendorRef?.name} disconnected`)
        sessionManager.updateVendorStatus(vendorId, 'disconnected', null)
        if (!this.manualDisconnects.has(vendorId)) {
          this.scheduleReconnect(account)
        }
      })

    } catch (err) {
      console.error(`[smpp-client] Failed to connect to vendor ${vendorId}:`, err)
      sessionManager.updateVendorStatus(vendorId, 'error', null)
      this.scheduleReconnect(account)
    }
  }

  private scheduleReconnect(account: Parameters<SMPPClientManager['doConnect']>[0]): void {
    const vendorId = account.vendor_id
    if (this.manualDisconnects.has(vendorId)) return
    if (this.reconnectTimers.has(vendorId)) return

    const delay = 30_000 // 30 seconds
    console.log(`[smpp-client] Reconnecting vendor ${vendorId} in ${delay / 1000}s...`)
    sessionManager.updateVendorStatus(vendorId, 'connecting')

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(vendorId)
      this.doConnect(account)
    }, delay)

    this.reconnectTimers.set(vendorId, timer)
  }

  /**
   * Submit an SMS to a specific vendor session.
   */
  async submitToVendor(
    vendorId: string,
    pdu: {
      sourceAddr: string
      destAddr: string
      shortMessage: string
      dataCoding?: number
    }
  ): Promise<SubmitResult> {
    const vendor = sessionManager.getVendor(vendorId)
    if (!vendor || vendor.status !== 'connected' || !vendor.session) {
      return { success: false, error: `Vendor ${vendorId} not connected` }
    }

    let sequenceNumber = Math.floor(Math.random() * 0x7fffffff)
    let pendingByVendor = this.pendingSubmits.get(vendorId)

    if (!pendingByVendor) {
      pendingByVendor = new Map()
      this.pendingSubmits.set(vendorId, pendingByVendor)
    }

    while (pendingByVendor.has(sequenceNumber)) {
      sequenceNumber = Math.floor(Math.random() * 0x7fffffff)
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const pending = this.pendingSubmits.get(vendorId)
        pending?.delete(sequenceNumber)
        if (pending?.size === 0) {
          this.pendingSubmits.delete(vendorId)
        }
        resolve({ success: false, error: 'Timeout waiting for submit_sm_resp' })
      }, 10_000)

      pendingByVendor.set(sequenceNumber, { timeout, resolve })

      vendor.session!.send({
        command: 'submit_sm',
        sequence_number: sequenceNumber,
        source_addr: pdu.sourceAddr,
        destination_addr: pdu.destAddr,
        short_message: pdu.shortMessage,
        data_coding: pdu.dataCoding ?? 0,
        registered_delivery: 1, // Request DLR
      } as smpp.PDU)
    })
  }

  async disconnectVendor(vendorId: string): Promise<void> {
    const vendor = sessionManager.getVendor(vendorId)
    this.manualDisconnects.add(vendorId)

    // Cancel any pending reconnect
    if (this.reconnectTimers.has(vendorId)) {
      clearTimeout(this.reconnectTimers.get(vendorId))
      this.reconnectTimers.delete(vendorId)
    }

    this.rejectPendingSubmits(vendorId, 'Vendor disconnected')

    if (vendor?.session) {
      vendor.session.send({
        command: 'unbind',
        sequence_number: Math.floor(Math.random() * 0x7fffffff),
      } as smpp.PDU)
      vendor.session.close()
    }

    if (vendor) {
      sessionManager.updateVendorStatus(vendorId, 'disconnected', null)
      return
    }

    await this.forceVendorStatusInDb(vendorId, 'DISCONNECTED')
  }

  async disconnectAll(): Promise<void> {
    for (const vendor of sessionManager.getAllVendors()) {
      await this.disconnectVendor(vendor.vendorId)
    }
    for (const [, timer] of this.reconnectTimers) {
      clearTimeout(timer)
    }
    this.reconnectTimers.clear()
  }

  private rejectPendingSubmits(vendorId: string, error: string): void {
    const pendingByVendor = this.pendingSubmits.get(vendorId)
    if (!pendingByVendor) return

    for (const pending of pendingByVendor.values()) {
      clearTimeout(pending.timeout)
      pending.resolve({ success: false, error })
    }

    this.pendingSubmits.delete(vendorId)
  }

  private getVendorRef(vendor: VendorAccount['vendors']): { id: string; name: string } | null {
    if (Array.isArray(vendor)) {
      return vendor[0] ?? null
    }

    return vendor ?? null
  }

  private async forceVendorStatusInDb(
    vendorId: string,
    status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING',
  ): Promise<void> {
    const db = getEngineDb()
    await db
      .from('vendors')
      .update({
        connection_status: status,
        last_connected_at: status === 'CONNECTED' ? new Date().toISOString() : null,
      })
      .eq('id', vendorId)
  }
}
