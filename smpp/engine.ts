/**
 * SMPPEngine — top-level orchestrator.
 * Singleton that owns the TCP server, vendor clients, and queue workers.
 */

import { SMPPServer } from './smpp-server'
import { SMPPClientManager } from './smpp-client'
import { startOutboundWorker } from './queues/sms-outbound.worker'
import { SessionManager } from './session-manager'
import type { Worker } from 'bullmq'

export type EngineStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error'

export class SMPPEngine {
  private static instance: SMPPEngine

  private smppServer: SMPPServer
  private clientManager: SMPPClientManager
  private workers: (Worker | null)[] = []

  private _status: EngineStatus = 'stopped'
  private _port = 2775
  private _startedAt: Date | null = null

  static getInstance(): SMPPEngine {
    if (!SMPPEngine.instance) {
      SMPPEngine.instance = new SMPPEngine()
    }
    return SMPPEngine.instance
  }

  private constructor() {
    this.smppServer = new SMPPServer()
    this.clientManager = SMPPClientManager.getInstance()
  }

  get status(): EngineStatus { return this._status }
  get port(): number { return this._port }
  get startedAt(): Date | null { return this._startedAt }

  async start(port = 2775): Promise<void> {
    if (this._status === 'running') {
      console.log('[engine] Already running')
      return
    }

    this._status = 'starting'
    this._port = port

    try {
      // 1. Start TCP server
      await this.smppServer.start(port)

      // 2. Start outbound worker (BullMQ)
      const worker = startOutboundWorker()
      this.workers.push(worker)

      // 3. Connect to all vendor SMPP accounts
      await this.clientManager.connectAllVendors()

      this._status = 'running'
      this._startedAt = new Date()
      console.log(`[engine] Started — TCP port ${port}, workers: ${this.workers.length}`)
    } catch (err) {
      this._status = 'error'
      console.error('[engine] Failed to start:', err)
      throw err
    }
  }

  async stop(): Promise<void> {
    if (this._status === 'stopped') return

    this._status = 'stopping'
    console.log('[engine] Stopping...')

    // 1. Stop accepting new messages
    await this.smppServer.stop()

    // 2. Disconnect vendors
    await this.clientManager.disconnectAll()

    // 3. Close workers (filter nulls — workers disabled when Redis is unavailable)
    await Promise.all(this.workers.filter(Boolean).map(w => w!.close()))
    this.workers = []

    this._status = 'stopped'
    this._startedAt = null
    console.log('[engine] Stopped')
  }

  getStatusSnapshot() {
    const sessions = SessionManager.getInstance()
    return {
      status: this._status,
      port: this._port,
      startedAt: this._startedAt?.toISOString() ?? null,
      activeSessions: sessions.getAllClients().length,
      connectedVendors: sessions.getAvailableVendors().length,
      totalVendors: sessions.getAllVendors().length,
    }
  }
}
