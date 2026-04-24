import { NextRequest, NextResponse } from 'next/server'
import { authorizeRequest } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await authorizeRequest(['ADMIN', 'MANAGER'])
  if (!auth.ok) return auth.response

  const { supabase } = auth.data
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

  // Find best route via routes + rate_plan_rates (same logic as LCREngine)
  const { data: routes } = await supabase
    .from('routes')
    .select(`
      id, priority, quality_score,
      vendors!inner(id, name, status),
      rate_plans!inner(
        id, name,
        rate_plan_rates(rate, mcc, mnc)
      )
    `)
    .eq('active', true)
    .eq('vendors.status', 'ACTIVE')

  type Candidate = {
    vendorName: string
    routeName: string
    priority: number
    cost: number
    qualityScore: number
  }
  type VendorRow = { id: string; name: string; status: string }
  type RatePlanRateRow = { rate: number; mcc: string; mnc: string | null }
  type RatePlanRow = { id: string; name: string; rate_plan_rates: RatePlanRateRow[] }
  const candidates: Candidate[] = []

  for (const route of routes ?? []) {
    const vendor = Array.isArray(route.vendors)
      ? (route.vendors[0] as VendorRow | undefined)
      : (route.vendors as VendorRow | null)
    const ratePlan = Array.isArray(route.rate_plans)
      ? (route.rate_plans[0] as RatePlanRow | undefined)
      : (route.rate_plans as RatePlanRow | null)

    if (!vendor || !ratePlan) continue

    const rates = ratePlan.rate_plan_rates ?? []
    const exactRate = rates.find((r) => r.mcc === mccMncRow!.mcc && r.mnc === mccMncRow!.mnc)
    const wildcardRate = rates.find((r) => r.mcc === mccMncRow!.mcc && (!r.mnc || r.mnc === ''))
    const matched = exactRate ?? wildcardRate
    if (!matched) continue

    candidates.push({
      vendorName: vendor.name,
      routeName: ratePlan.name,
      priority: route.priority ?? 0,
      cost: matched.rate,
      qualityScore: route.quality_score ?? 100,
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
    if (a.cost !== b.cost) return a.cost - b.cost
    if (a.qualityScore !== b.qualityScore) return b.qualityScore - a.qualityScore
    return b.priority - a.priority
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
