import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SMPPClientManager } from '@/smpp/smpp-client'

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
    const clientManager = SMPPClientManager.getInstance()
    await clientManager.disconnectVendor(vendorId)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
