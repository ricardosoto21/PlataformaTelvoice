import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const number = req.nextUrl.searchParams.get('number') ?? ''
  const digits = number.replace(/\D/g, '')

  if (digits.length < 5) {
    return NextResponse.json({ matched: false, reason: 'Number too short — need at least 5 digits' })
  }

  // Resolve MCC/MNC from prefix database
  let mccMncRow: { mcc: string; mnc: string; country: string; operator: string } | null = null
  for (const mncLen of [3, 2]) {
    const mcc = digits.slice(0, 3)
    const mnc = digits.slice(3, 3 + mncLen)
    const { data } = await supabase
      .from('mcc_mnc')
      .select('mcc, mnc, country, operator')
      .eq('mcc', mcc)
      .eq('mnc', mnc)
      .single()
    if (data) { mccMncRow = data; break }
  }

  if (!mccMncRow) {
    return NextResponse.json({
      matched: false,
      reason: `No MCC/MNC entry found for prefix ${digits.slice(0, 6)}`,
    })
  }

  const { data: rules, error: rulesError } = await supabase
    .from('lcr_rules')
    .select(`
      id, mcc, mnc, priority, cost,
      vendor:vendors!inner(id, name, active, connection_status),
      route:routes(id, name)
    `)
    .eq('active', true)
    .eq('vendor.active', true)
    .or(`and(mcc.eq.${mccMncRow.mcc},mnc.eq.${mccMncRow.mnc}),and(mcc.eq.000,mnc.eq.000)`)

  if (rulesError) {
    return NextResponse.json({ matched: false, reason: rulesError.message }, { status: 500 })
  }

  type RuleRow = {
    id: string
    mcc: string
    mnc: string
    priority: number | null
    cost: number | null
    vendor: { id: string; name: string; active: boolean; connection_status: string | null } | { id: string; name: string; active: boolean; connection_status: string | null }[] | null
    route: { id: string; name: string } | { id: string; name: string }[] | null
  }

  type Candidate = {
    vendorName: string
    routeName: string
    priority: number
    cost: number
    connected: boolean
    exact: boolean
  }
  const candidates: Candidate[] = []

  for (const rule of (rules ?? []) as unknown as RuleRow[]) {
    const vendor = Array.isArray(rule.vendor) ? rule.vendor[0] : rule.vendor
    const route = Array.isArray(rule.route) ? rule.route[0] : rule.route
    if (!vendor) continue

    candidates.push({
      vendorName: vendor.name,
      routeName: route?.name ?? '-',
      priority: rule.priority ?? 0,
      cost: Number(rule.cost) || 0,
      connected: vendor.connection_status === 'CONNECTED',
      exact: rule.mcc === mccMncRow.mcc && rule.mnc === mccMncRow.mnc,
    })
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      matched: false,
      reason: `No active route with a rate for MCC ${mccMncRow.mcc} / MNC ${mccMncRow.mnc}`,
      mcc: mccMncRow.mcc,
      mnc: mccMncRow.mnc,
      country: mccMncRow.country,
      operator: mccMncRow.operator,
    })
  }

  candidates.sort((a, b) => {
    if (a.connected !== b.connected) return a.connected ? -1 : 1
    if (a.exact !== b.exact) return a.exact ? -1 : 1
    if (a.cost !== b.cost) return a.cost - b.cost
    return a.priority - b.priority
  })

  const best = candidates[0]

  return NextResponse.json({
    matched: true,
    mcc: mccMncRow.mcc,
    mnc: mccMncRow.mnc,
    country: mccMncRow.country,
    operator: mccMncRow.operator,
    vendor: best.vendorName,
    vendorAccount: '-',
    priority: best.priority,
    cost: best.cost,
    route: best.routeName,
  })
}
