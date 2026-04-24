/**
 * TelvoiceSMS - Custom Next.js Server
 * Boots the Next.js HTTP server alongside the SMPP TCP engine
 * in the same Node.js process.
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { SMPPEngine } from './smpp/engine'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Start the HTTP server for Next.js
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('[server] Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  httpServer.listen(port, hostname, () => {
    console.log(`[server] Next.js ready on http://${hostname}:${port}`)
  })

  // Start the SMPP Engine (TCP server + queue workers)
  const smppPort = parseInt(process.env.SMPP_PORT || '2775', 10)
  const engine = SMPPEngine.getInstance()

  try {
    await engine.start(smppPort)
    console.log(`[server] SMPP Engine started on TCP port ${smppPort}`)
  } catch (err) {
    console.error('[server] Failed to start SMPP Engine:', err)
    // Engine failure is non-fatal — Next.js still runs
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[server] Shutting down...')
    await engine.stop()
    httpServer.close(() => {
      console.log('[server] HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
})
