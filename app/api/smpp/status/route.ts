import { NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'
import { SMPPEngine } from '@/smpp/engine'
import { SessionManager } from '@/smpp/session-manager'
import { getQueueStats } from '@/smpp/queues/queue-manager'

export async function GET() {
  const auth = await authorizeRequest(['ADMIN', 'MANAGER'])
  if (!auth.ok) return auth.response

  try {
    const engine = SMPPEngine.getInstance()
    const sessions = SessionManager.getInstance()
    const queueStats = await getQueueStats()

    return NextResponse.json({
      engine: engine.getStatusSnapshot(),
      clients: sessions.getClientSnapshot(),
      vendors: sessions.getVendorSnapshot(),
      queues: queueStats,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to get engine status' },
      { status: 500 }
    )
  }
}
