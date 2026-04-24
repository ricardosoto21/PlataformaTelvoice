import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/smpp/session-manager'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = SessionManager.getInstance()
  return NextResponse.json({
    clients: sessions.getClientSnapshot(),
    vendors: sessions.getVendorSnapshot(),
  })
}
