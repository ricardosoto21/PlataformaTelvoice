import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SMPPEngine } from '@/smpp/engine'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  try {
    const engine = SMPPEngine.getInstance()
    await engine.stop()
    return NextResponse.json({ success: true, status: engine.getStatusSnapshot() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
