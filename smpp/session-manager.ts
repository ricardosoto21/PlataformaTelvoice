/**
 * Session Manager — tracks all active SMPP sessions (bound clients + vendor connections).
 * Singleton shared across the engine.
 */

import type { Session } from 'smpp'

export type BindMode = 'transmitter' | 'receiver' | 'transceiver'

export interface ClientSession {
  sessionId: string
  systemId: string       // SMPP system_id (username)
  customerId: string     // FK to customers table
  bindMode: BindMode
  remoteAddress: string
  remotePort: number
  session: Session
  boundAt: Date
  msgSent: number
  msgReceived: number
  throughputTps: number  // messages/second (rolling window)
  lastActivity: Date
}

export interface VendorSession {
  sessionId: string
  vendorId: string
  vendorName: string
  smppAccountId: string
  host: string
  port: number
  systemId: string
  bindMode: BindMode
  session: Session | null
  connectedAt: Date | null
  reconnecting: boolean
  msgSent: number
  msgReceived: number
  dlrReceived: number
  lastActivity: Date | null
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
}

export class SessionManager {
  private static instance: SessionManager
  private clients = new Map<string, ClientSession>()
  private vendors = new Map<string, VendorSession>()

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // -------------------------------------------------------
  // Client sessions (inbound from customers)
  // -------------------------------------------------------
  addClient(session: ClientSession): void {
    this.clients.set(session.sessionId, session)
  }

  removeClient(sessionId: string): void {
    this.clients.delete(sessionId)
  }

  getClient(sessionId: string): ClientSession | undefined {
    return this.clients.get(sessionId)
  }

  getClientBySystemId(systemId: string): ClientSession | undefined {
    for (const s of this.clients.values()) {
      if (s.systemId === systemId) return s
    }
    return undefined
  }

  countClientsBySystemId(systemId: string): number {
    let count = 0
    for (const s of this.clients.values()) {
      if (s.systemId === systemId) count++
    }
    return count
  }

  getAllClients(): ClientSession[] {
    return Array.from(this.clients.values())
  }

  incrementClientMsgSent(sessionId: string): void {
    const s = this.clients.get(sessionId)
    if (s) {
      s.msgSent++
      s.lastActivity = new Date()
    }
  }

  incrementClientMsgReceived(sessionId: string): void {
    const s = this.clients.get(sessionId)
    if (s) {
      s.msgReceived++
      s.lastActivity = new Date()
    }
  }

  // -------------------------------------------------------
  // Vendor sessions (outbound to vendors)
  // -------------------------------------------------------
  addVendor(vendorSession: VendorSession): void {
    this.vendors.set(vendorSession.vendorId, vendorSession)
  }

  removeVendor(vendorId: string): void {
    this.vendors.delete(vendorId)
  }

  getVendor(vendorId: string): VendorSession | undefined {
    return this.vendors.get(vendorId)
  }

  getAllVendors(): VendorSession[] {
    return Array.from(this.vendors.values())
  }

  getAvailableVendors(): VendorSession[] {
    return Array.from(this.vendors.values()).filter(v => v.status === 'connected')
  }

  updateVendorStatus(
    vendorId: string,
    status: VendorSession['status'],
    session?: Session | null,
  ): void {
    const v = this.vendors.get(vendorId)
    if (v) {
      v.status = status
      if (session !== undefined) v.session = session
      if (status === 'connected') v.connectedAt = new Date()
      if (status === 'disconnected') v.session = null
    }
  }

  incrementVendorMsgSent(vendorId: string): void {
    const v = this.vendors.get(vendorId)
    if (v) {
      v.msgSent++
      v.lastActivity = new Date()
    }
  }

  incrementVendorDlrReceived(vendorId: string): void {
    const v = this.vendors.get(vendorId)
    if (v) {
      v.dlrReceived++
      v.lastActivity = new Date()
    }
  }

  // -------------------------------------------------------
  // Serialisable snapshots (for API responses / UI)
  // -------------------------------------------------------
  getClientSnapshot() {
    return this.getAllClients().map(s => ({
      sessionId: s.sessionId,
      systemId: s.systemId,
      customerId: s.customerId,
      bindMode: s.bindMode,
      remoteAddress: s.remoteAddress,
      remotePort: s.remotePort,
      boundAt: s.boundAt.toISOString(),
      msgSent: s.msgSent,
      msgReceived: s.msgReceived,
      lastActivity: s.lastActivity.toISOString(),
    }))
  }

  getVendorSnapshot() {
    return this.getAllVendors().map(v => ({
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      smppAccountId: v.smppAccountId,
      host: v.host,
      port: v.port,
      systemId: v.systemId,
      bindMode: v.bindMode,
      status: v.status,
      connectedAt: v.connectedAt?.toISOString() ?? null,
      msgSent: v.msgSent,
      msgReceived: v.msgReceived,
      dlrReceived: v.dlrReceived,
      lastActivity: v.lastActivity?.toISOString() ?? null,
    }))
  }
}
