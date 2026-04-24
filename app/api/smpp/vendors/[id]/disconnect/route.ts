import { NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'
import { SMPPClientManager } from '@/smpp/smpp-client'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRequest(['ADMIN', 'MANAGER'])
  if (!auth.ok) return auth.response

  const { id: vendorId } = await params

  try {
    const clientManager = SMPPClientManager.getInstance()
    await clientManager.disconnectVendor(vendorId)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
