/**
 * SMPP TCP Server — accepts inbound bind requests from customer SMPP accounts.
 * Authenticates via smpp_accounts table (system_id + password).
 * Enforces: max connections, throughput limits, IP whitelist.
 */

import * as smpp from 'smpp'
import { v4 as uuidv4 } from 'uuid'
import { getEngineDb } from './db'
import { SessionManager, type BindMode } from './session-manager'
import { MessageProcessor } from './message-processor'
import { verifyPassword } from './crypto'

const sessionManager = SessionManager.getInstance()

export class SMPPServer {
  private server: smpp.Server | null = null
  private port = 2775

  async start(port: number): Promise<void> {
    this.port = port

    this.server = new smpp.Server({ enable_enquire_link_resp: true }, (session) => {
      this.handleSession(session)
    })

    return new Promise((resolve, reject) => {
      this.server!.listen(port, '0.0.0.0', () => {
        console.log(`[smpp-server] Listening on TCP port ${port}`)
        resolve()
      })
      this.server!.on('error', reject)
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) return resolve()
      // Unbind all active client sessions
      for (const cs of sessionManager.getAllClients()) {
        try { cs.session.close() } catch {}
      }
      this.server.close(() => {
        this.server = null
        console.log('[smpp-server] Server stopped')
        resolve()
      })
    })
  }

  // -------------------------------------------------------
  // Session lifecycle
  // -------------------------------------------------------
  private handleSession(session: smpp.Session): void {
    const remoteAddress = session.remoteAddress ?? '0.0.0.0'
    const remotePort = session.remotePort ?? 0
    console.log(`[smpp-server] New connection from ${remoteAddress}:${remotePort}`)

    // Handle bind commands
    const bindHandler = (bindMode: BindMode) => async (pdu: smpp.PDU) => {
      await this.handleBind(session, pdu, bindMode, remoteAddress, remotePort)
    }

    session.on('bind_transceiver', bindHandler('transceiver'))
    session.on('bind_transmitter', bindHandler('transmitter'))
    session.on('bind_receiver', bindHandler('receiver'))

    session.on('error', (err) => {
      console.error(`[smpp-server] Session error from ${remoteAddress}:`, err.message)
    })

    session.on('close', () => {
      // Find and remove session from manager
      const found = sessionManager.getAllClients().find(
        (s) => s.remoteAddress === remoteAddress && s.remotePort === remotePort
      )
      if (found) {
        sessionManager.removeClient(found.sessionId)
        console.log(`[smpp-server] Client disconnected: ${found.systemId} (${remoteAddress})`)
      }
    })
  }

 private async handleBind(
    session: smpp.Session,
    pdu: smpp.PDU,
    bindMode: BindMode,
    remoteAddress: string,
    remotePort: number,
  ): Promise<void> {
    const systemId = pdu.system_id ?? ''
    const password = pdu.password ?? ''

    try {
      const db = getEngineDb()

      // 1. Buscamos la cuenta SMPP con los nombres correctos de las columnas
      const { data: account, error } = await db
        .from('smpp_accounts')
        .select(`
          id, system_id, password, active, bind_mode, max_connections,
          throughput, allowed_ips, customer_id,
          customers ( id, name, active, balance )
        `)
        .eq('system_id', systemId)
        .single()

      if (error || !account) {
        console.warn(`[smpp-server] Unknown system_id: ${systemId}`)
        // Forma correcta de responder un rechazo en la librería smpp
        session.send(pdu.response({ command_status: smpp.ESME_RINVSYSID }))
        session.close()
        return
      }

      // 2. Verificar contraseña
      if (!verifyPassword(password, account.password)) {
        console.warn(`[smpp-server] Invalid password for: ${systemId}`)
        session.send(pdu.response({ command_status: smpp.ESME_RINVPASWD }))
        session.close()
        return
      }

      // 3. Verificar si la cuenta SMPP está activa
      if (!account.active) {
        console.warn(`[smpp-server] Account inactive: ${systemId}`)
        session.send(pdu.response({ command_status: smpp.ESME_RBINDFAIL }))
        session.close()
        return
      }

      // 4. Verificar si el Cliente dueño de la cuenta está activo
      const customer = account.customers as any
      if (!customer || !customer.active) {
        console.warn(`[smpp-server] Customer inactive for: ${systemId}`)
        session.send(pdu.response({ command_status: smpp.ESME_RBINDFAIL }))
        session.close()
        return
      }

      // 5. Verificar IP Whitelist
      if (account.allowed_ips && Array.isArray(account.allowed_ips) && account.allowed_ips.length > 0) {
        if (!account.allowed_ips.includes(remoteAddress)) {
          console.warn(`[smpp-server] IP not whitelisted: ${remoteAddress} for ${systemId}`)
          session.send(pdu.response({ command_status: smpp.ESME_RBINDFAIL }))
          session.close()
          return
        }
      }

      // 6. Verificar límite de conexiones
      const currentConnections = sessionManager.countClientsBySystemId(systemId)
      if (account.max_connections && currentConnections >= account.max_connections) {
        console.warn(`[smpp-server] Max connections reached for: ${systemId}`)
        session.send(pdu.response({ command_status: smpp.ESME_RBINDFAIL }))
        session.close()
        return
      }

      // 7. ¡Conexión Aceptada!
      const sessionId = uuidv4()
      sessionManager.addClient({
        sessionId,
        systemId,
        customerId: account.customer_id,
        bindMode,
        remoteAddress,
        remotePort,
        session,
        boundAt: new Date(),
        msgSent: 0,
        msgReceived: 0,
        throughputTps: 0,
        lastActivity: new Date(),
      })

      // Responder OK al cliente
      session.send(pdu.response({
        command_status: smpp.ESME_ROK,
        system_id: systemId,
      }))

      console.log(`[smpp-server] ${systemId} bound as ${bindMode} from ${remoteAddress}:${remotePort}`)

      // 8. Registrar qué hacer cuando llegan mensajes
      this.registerMessageHandlers(session, sessionId, account.customer_id)

    } catch (err) {
      console.error(`[smpp-server] Error during bind for ${systemId}:`, err)
      session.send(pdu.response({ command_status: smpp.ESME_RBINDFAIL }))
      session.close()
    }
  }

  private registerMessageHandlers(
    session: smpp.Session,
    sessionId: string,
    customerId: string,
  ): void {
    const processor = MessageProcessor.getInstance()

    // Cuando el cliente envía un SMS
    session.on('submit_sm', async (pdu) => {
      sessionManager.incrementClientMsgSent(sessionId)

      // Responderle de inmediato que recibimos el mensaje (con un Message ID generado)
      session.send(pdu.response({
        command_status: smpp.ESME_ROK,
        message_id: uuidv4(),
      }))

      // Enviar a la cola para procesar
      await processor.enqueueOutbound(pdu, customerId, sessionId)
    })

    // Heartbeat del protocolo SMPP
    session.on('enquire_link', (pdu) => {
      session.send(pdu.response({ command_status: smpp.ESME_ROK }))
    })

    // Cuando el cliente se desconecta
    session.on('unbind', (pdu) => {
      session.send(pdu.response({ command_status: smpp.ESME_ROK }))
      session.close()
    })
  }
}

