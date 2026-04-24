import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SMPPClientManager } from '@/smpp/smpp-client'
import { getEngineDb } from '@/smpp/db'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['ADMIN', 'MANAGER'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { id: vendorId } = await params

  try {
    const db = getEngineDb()
    const { data: account } = await db
      .from('smpp_accounts')
      .select('id, system_id, password, host, port, bind_mode, vendor_id, vendors(id, name)')
      .eq('vendor_id', vendorId)
      .eq('type', 'VENDOR')
      .eq('status', 'ACTIVE')
      .single()

    if (!account) {
      return NextResponse.json({ error: 'No active SMPP account for this vendor' }, { status: 404 })
    }

    const clientManager = SMPPClientManager.getInstance()
    await clientManager.connectVendor(account as Parameters<typeof clientManager.connectVendor>[0])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
