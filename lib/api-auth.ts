import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type AppRole = 'ADMIN' | 'MANAGER' | 'USER'

type AuthSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  role: AppRole | null
}

type AuthResult =
  | { ok: true; data: AuthSuccess }
  | { ok: false; response: NextResponse }

export async function authorizeRequest(allowedRoles?: AppRole[]): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let role: AppRole | null = null

  if (allowedRoles?.length) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    role = (profile?.role as AppRole | null) ?? null

    if (!role || !allowedRoles.includes(role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
      }
    }
  }

  return {
    ok: true,
    data: {
      supabase,
      userId: user.id,
      role,
    },
  }
}
