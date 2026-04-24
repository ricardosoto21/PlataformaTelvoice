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

    // Register vendor in session manager if not present
    if (!existing) {
      sessionManager.addVendor({
        sessionId: uuidv4(),
        vendorId,
        vendorName: account.vendors?.name ?? vendorId,
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

    try {
      const session = smpp.connect({
        host: account.host,
        port: account.port,
        auto_enquire_link_period: 30000,
        reconnect: 0, // we handle reconnect manually
      })

      // Bind on connect
      session.on('connect' as 'error', () => {
        const bindCmd = account.bind_mode === 'receiver'
          ? 'bind_receiver'
          : account.bind_mode === 'transmitter'
            ? 'bind_transmitter'
            : 'bind_transceiver'

        session.send({
          command: bindCmd,
          system_id: account.system_id,
          password: account.password,
          system_type: 'VMA',
          sequence_number: 1,
        } as smpp.PDU)
      })

      // Bind response
      const bindRespCmd = account.bind_mode === 'receiver'
        ? 'bind_receiver_resp'
        : account.bind_mode === 'transmitter'
          ? 'bind_transmitter_resp'
          : 'bind_transceiver_resp'

      session.on(bindRespCmd as 'error', (pdu: smpp.PDU) => {
        if (pdu.command_status === 0) {
          sessionManager.updateVendorStatus(vendorId, 'connected', session)
          console.log(`[smpp-client] Vendor ${account.vendors?.name} (${account.host}) connected`)
          // Clear any pending reconnect timer
          if (this.reconnectTimers.has(vendorId)) {
            clearTimeout(this.reconnectTimers.get(vendorId))
            this.reconnectTimers.delete(vendorId)
          }
        } else {
          console.warn(`[smpp-client] Vendor bind failed: ${account.vendors?.name}, status: ${pdu.command_status}`)
          sessionManager.updateVendorStatus(vendorId, 'error', null)
          this.scheduleReconnect(account)
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

      session.on('error', (err: Error) => {
        console.error(`[smpp-client] Vendor ${account.vendors?.name} error:`, err.message)
        sessionManager.updateVendorStatus(vendorId, 'error', null)
      })

      session.on('close', () => {
        console.log(`[smpp-client] Vendor ${account.vendors?.name} disconnected`)
        sessionManager.updateVendorStatus(vendorId, 'disconnected', null)
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

    const messageId = uuidv4()

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout waiting for submit_sm_resp' })
      }, 10_000)

      vendor.session!.on('submit_sm_resp', (respPdu: smpp.PDU) => {
        clearTimeout(timeout)
        if (respPdu.command_status === 0) {
          sessionManager.incrementVendorMsgSent(vendorId)
          resolve({ success: true, messageId: respPdu.message_id ?? messageId })
        } else {
          resolve({ success: false, error: `SMPP error code: ${respPdu.command_status}` })
        }
      })

      vendor.session!.send({
        command: 'submit_sm',
        sequence_number: Math.floor(Math.random() * 0x7fffffff),
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
    if (!vendor?.session) return

    // Cancel any pending reconnect
    if (this.reconnectTimers.has(vendorId)) {
      clearTimeout(this.reconnectTimers.get(vendorId))
      this.reconnectTimers.delete(vendorId)
    }

    vendor.session.send({
      command: 'unbind',
      sequence_number: Math.floor(Math.random() * 0x7fffffff),
    } as smpp.PDU)

    vendor.session.close()
    sessionManager.updateVendorStatus(vendorId, 'disconnected', null)
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
