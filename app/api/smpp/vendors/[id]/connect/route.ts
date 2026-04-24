import { NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'
import { SMPPClientManager } from '@/smpp/smpp-client'
import { getEngineDb } from '@/smpp/db'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRequest(['ADMIN', 'MANAGER'])
  if (!auth.ok) return auth.response

  const { id: vendorId } = await params

  try {
    const db = getEngineDb()
    
    // 1. Buscamos directamente en la tabla VENDORS (no en smpp_accounts)
    const { data: vendor } = await db
      .from('vendors')
      .select('id, name, smpp_host, smpp_port, smpp_system_id, smpp_password, smpp_bind_mode, active')
      .eq('id', vendorId)
      .single()

    // 2. Verificamos que exista y esté activo
    if (!vendor || !vendor.active) {
      return NextResponse.json({ error: 'Vendor not found or inactive' }, { status: 404 })
    }

    // 3. Adaptamos los datos al formato que espera el motor SMPP
    const accountPayload = {
      id: vendor.id,
      system_id: vendor.smpp_system_id,
      password: vendor.smpp_password,
      host: vendor.smpp_host,
      port: vendor.smpp_port,
      bind_mode: vendor.smpp_bind_mode,
      vendor_id: vendor.id,
      vendors: { id: vendor.id, name: vendor.name }
    }

    // 4. ¡Enviamos la orden de conexión!
    const clientManager = SMPPClientManager.getInstance()
    await clientManager.connectVendor(accountPayload as any)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
