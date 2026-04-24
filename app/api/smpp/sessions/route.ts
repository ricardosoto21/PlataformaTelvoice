import { NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'
import { SessionManager } from '@/smpp/session-manager'

export async function GET() {
  const auth = await authorizeRequest(['ADMIN', 'MANAGER'])
  if (!auth.ok) return auth.response

  const sessions = SessionManager.getInstance()
  return NextResponse.json({
    clients: sessions.getClientSnapshot(),
    vendors: sessions.getVendorSnapshot(),
  })
}
