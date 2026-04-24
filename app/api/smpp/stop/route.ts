import { NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'
import { SMPPEngine } from '@/smpp/engine'

export async function POST() {
  const auth = await authorizeRequest(['ADMIN'])
  if (!auth.ok) return auth.response

  try {
    const engine = SMPPEngine.getInstance()
    await engine.stop()
    return NextResponse.json({ success: true, status: engine.getStatusSnapshot() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
