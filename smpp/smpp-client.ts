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

export class SMPPClientManager {
  private static instance: SMPPClientManager
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

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
    // Load vendor connections directly from the vendors table —
    // it already stores all SMPP credentials (smpp_host, smpp_port, etc.)
    const { data: vendors } = await db
      .from('vendors')
      .select('id, name, smpp_host, smpp_port, smpp_system_id, smpp_password, smpp_bind_mode, active')
      .eq('active', true)

    if (!vendors) return

    for (const vendor of vendors) {
      if (!vendor.smpp_host || !vendor.smpp_system_id) {
        console.warn(`[smpp-client] Vendor ${vendor.name} missing SMPP host/system_id — skipping`)
        continue
      }
      await this.connectVendor({
        id: vendor.id,
        system_id: vendor.smpp_system_id,
        password: vendor.smpp_password ?? '',
        host: vendor.smpp_host,
        port: vendor.smpp_port ?? 2775,
        bind_mode: vendor.smpp_bind_mode ?? 'TRX',
        vendor_id: vendor.id,
        vendors: { id: vendor.id, name: vendor.name },
      })
    }
  }

  async connectVendor(account: {
    id: string
    system_id: string
    password: string
    host: string
    port: number
    bind_mode: string
    vendor_id: string
    vendors: { id: string; name: string } | null
  }): Promise<void> {
    const vendorId = account.vendor_id
    const existing = sessionManager.getVendor(vendorId)

    if (existing?.status === 'connected') {
      console.log(`[smpp-client] Vendor ${vendorId} already connected`)
      return
    }

    // Map UI bind mode labels (TRX/TX/RX) to smpp library values
    const bindModeMap: Record<string, 'transceiver' | 'transmitter' | 'receiver'> = {
      TRX: 'transceiver', TX: 'transmitter', RX: 'receiver',
      transceiver: 'transceiver', transmitter: 'transmitter', receiver: 'receiver',
    }
    const bindMode = bindModeMap[account.bind_mode] ?? 'transceiver'

    if (!existing) {
      sessionManager.addVendor({
        sessionId: uuidv4(),
        vendorId,
        vendorName: account.vendors?.name ?? vendorId,
        smppAccountId: account.id,
        host: account.host,
        port: account.port,
        systemId: account.system_id,
        bindMode,
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

  private async updateDbStatus(vendorId: string, status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR') {
    const db = getEngineDb()
    try {
      await db
        .from('vendors')
        .update({
          connection_status: status,
          last_connected_at: status === 'CONNECTED' ? new Date().toISOString() : undefined
        })
        .eq('id', vendorId)
    } catch (err) {
      console.error(`[smpp-client] Failed to update DB status for vendor ${vendorId}:`, err)
    }
  }

  private doConnect(account: {
    id: string
    system_id: string
    password: string
    host: string
    port: number
    bind_mode: string
    vendor_id: string
    vendors: { id: string; name: string } | null
  }): void {
    const vendorId = account.vendor_id
    const vendorName = account.vendors?.name ?? vendorId

    try {
      const session = smpp.connect({
        host: account.host,
        port: account.port,
        auto_enquire_link_period: 30000,
        reconnect: 0, // we handle reconnect manually
      })

      // Use the proper smpp library bind methods (same as test-client.mjs)
      session.on('connect' as 'error', () => {
        const bindParams = {
          system_id: account.system_id,
          password: account.password,
          system_type: 'VMA',
        }

        const handleBindResp = (pdu: smpp.PDU) => {
          if (pdu.command_status === 0) {
            sessionManager.updateVendorStatus(vendorId, 'connected', session)
            this.updateDbStatus(vendorId, 'CONNECTED')
            console.log(`[smpp-client] Vendor ${vendorName} (${account.host}:${account.port}) connected`)
            if (this.reconnectTimers.has(vendorId)) {
              clearTimeout(this.reconnectTimers.get(vendorId))
              this.reconnectTimers.delete(vendorId)
            }
          } else {
            console.warn(`[smpp-client] Vendor ${vendorName} bind failed with status: ${pdu.command_status}`)
            sessionManager.updateVendorStatus(vendorId, 'error', null)
            this.updateDbStatus(vendorId, 'ERROR')
            this.scheduleReconnect(account)
          }
        }

        if (account.bind_mode === 'receiver') {
          session.bind_receiver(bindParams, handleBindResp)
        } else if (account.bind_mode === 'transmitter') {
          session.bind_transmitter(bindParams, handleBindResp)
        } else {
          session.bind_transceiver(bindParams, handleBindResp)
        }
      })

      // Incoming deliver_sm from vendor (DLR / MO) — use pdu.response()
      session.on('deliver_sm', async (pdu: smpp.PDU) => {
        sessionManager.incrementVendorDlrReceived(vendorId)
        session.send(pdu.response({ command_status: 0 }))
        await DLRHandler.getInstance().handleDLR(pdu, vendorId)
      })

      session.on('error', (err: Error) => {
        console.error(`[smpp-client] Vendor ${vendorName} error:`, err.message)
        sessionManager.updateVendorStatus(vendorId, 'error', null)
        this.updateDbStatus(vendorId, 'ERROR')
      })

      session.on('close', () => {
        console.log(`[smpp-client] Vendor ${vendorName} disconnected`)
        sessionManager.updateVendorStatus(vendorId, 'disconnected', null)
        this.updateDbStatus(vendorId, 'DISCONNECTED')
        this.scheduleReconnect(account)
      })

    } catch (err) {
      console.error(`[smpp-client] Failed to connect to vendor ${vendorId}:`, err)
      sessionManager.updateVendorStatus(vendorId, 'error', null)
      this.scheduleReconnect(account)
    }
  }

  private scheduleReconnect(account: Parameters<SMPPClientManager['doConnect']>[0]): void {
    const vendorId = account.vendor_id
    if (this.reconnectTimers.has(vendorId)) return

    const delay = 30_000 // 30 seconds
    console.log(`[smpp-client] Reconnecting vendor ${vendorId} in ${delay / 1000}s...`)
    sessionManager.updateVendorStatus(vendorId, 'connecting')
    this.updateDbStatus(vendorId, 'RECONNECTING')

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
    msg: {
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

    const messageId = uuidv4()

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout waiting for submit_sm_resp' })
      }, 10_000)

      // Use the smpp library's submit_sm method (callback receives submit_sm_resp)
      vendor.session!.submit_sm({
        source_addr: msg.sourceAddr,
        destination_addr: msg.destAddr,
        short_message: msg.shortMessage,
        data_coding: msg.dataCoding ?? 0,
        registered_delivery: 1, // Request DLR
      }, (respPdu: smpp.PDU) => {
        clearTimeout(timeout)
        if (respPdu.command_status === 0) {
          sessionManager.incrementVendorMsgSent(vendorId)
          resolve({ success: true, messageId: respPdu.message_id ?? messageId })
        } else {
          resolve({ success: false, error: `SMPP error code: ${respPdu.command_status}` })
        }
      })
    })
  }

  async disconnectVendor(vendorId: string): Promise<void> {
    const vendor = sessionManager.getVendor(vendorId)
    if (!vendor?.session) return

    // Cancel any pending reconnect
    if (this.reconnectTimers.has(vendorId)) {
      clearTimeout(this.reconnectTimers.get(vendorId))
      this.reconnectTimers.delete(vendorId)
    }

    // Close socket directly — avoid PDU exchange during shutdown
    try { vendor.session.close() } catch {}
    sessionManager.updateVendorStatus(vendorId, 'disconnected', null)
    this.updateDbStatus(vendorId, 'DISCONNECTED')
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
}
