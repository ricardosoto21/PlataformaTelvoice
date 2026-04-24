/**
 * LCR Engine — Least Cost Routing
 * Selects the best available vendor for a given MCC/MNC based on:
 * 1. Load distribution rules (if configured for customer+mcc+mnc)
 * 2. Lowest cost with highest quality among connected vendors
 * 3. Vendor priority as tiebreaker
 */

import { getEngineDb } from './db'
import { SessionManager } from './session-manager'

export interface RouteResult {
  vendorId: string
  vendorName: string
  vendorRate: number
  routeId: string
}

const sessionManager = SessionManager.getInstance()

export class LCREngine {
  private static instance: LCREngine

  static getInstance(): LCREngine {
    if (!LCREngine.instance) {
      LCREngine.instance = new LCREngine()
    }
    return LCREngine.instance
  }

  /**
   * Find the best vendor route for a given destination.
   */
  async findRoute(params: {
    customerId: string
    mcc: string
    mnc: string
    sourceAddr: string
  }): Promise<RouteResult | null> {
    const db = getEngineDb()
    const availableVendorIds = sessionManager.getAvailableVendors().map(v => v.vendorId)

    if (availableVendorIds.length === 0) {
      console.warn('[lcr] No vendors available')
      return null
    }

    // 1. Check load distribution rules (customer-specific first, then global)
    const loadResult = await this.checkLoadDistribution(
      params.customerId,
      params.mcc,
      params.mnc,
      availableVendorIds,
    )
    if (loadResult) return loadResult

    // 2. Standard LCR: find cheapest route via routes + rate_plans
    const { data: routes } = await db
      .from('routes')
      .select(`
        id, vendor_id, priority, quality_score,
        rate_plans!inner (
          id,
          rate_plan_rates (
            rate,
            mcc,
            mnc
          )
        ),
        vendors!inner ( id, name, status )
      `)
      .in('vendor_id', availableVendorIds)
      .eq('vendors.status', 'ACTIVE')
      .eq('active', true)

    if (!routes || routes.length === 0) {
      console.warn('[lcr] No routes found for available vendors')
      return null
    }

    // Find matching rate for MCC/MNC
    type RouteCandidate = {
      vendorId: string
      vendorName: string
      vendorRate: number
      routeId: string
      priority: number
      qualityScore: number
    }
    type RatePlanRateRow = { rate: number; mcc: string; mnc: string | null }
    type RatePlanRow = { id: string; rate_plan_rates: RatePlanRateRow[] }
    type VendorRow = { id: string; name: string; status?: string }
    const candidates: RouteCandidate[] = []

    for (const route of routes) {
      const ratePlan = Array.isArray(route.rate_plans)
        ? (route.rate_plans[0] as RatePlanRow | undefined)
        : (route.rate_plans as RatePlanRow | null)
      if (!ratePlan) continue

      // Find exact MCC+MNC match first, then MCC-only (wildcard MNC)
      const rates = ratePlan.rate_plan_rates ?? []
      const exactRate = rates.find(r => r.mcc === params.mcc && r.mnc === params.mnc)
      const wildcardRate = rates.find(r => r.mcc === params.mcc && (!r.mnc || r.mnc === ''))
      const matchedRate = exactRate ?? wildcardRate

      if (!matchedRate) continue

      const vendor = Array.isArray(route.vendors)
        ? (route.vendors[0] as VendorRow | undefined)
        : (route.vendors as VendorRow | null)
      if (!vendor) continue

      candidates.push({
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorRate: matchedRate.rate,
        routeId: route.id,
        priority: route.priority ?? 0,
        qualityScore: route.quality_score ?? 100,
      })
    }

    if (candidates.length === 0) {
      console.warn(`[lcr] No rate found for MCC ${params.mcc} MNC ${params.mnc}`)
      return null
    }

    // Sort: lowest cost first, then highest quality, then priority
    candidates.sort((a, b) => {
      if (a.vendorRate !== b.vendorRate) return a.vendorRate - b.vendorRate
      if (a.qualityScore !== b.qualityScore) return b.qualityScore - a.qualityScore
      return b.priority - a.priority
    })

    const best = candidates[0]
    return {
      vendorId: best.vendorId,
      vendorName: best.vendorName,
      vendorRate: best.vendorRate,
      routeId: best.routeId,
    }
  }

  /**
   * Check load distribution rules.
   * Returns a vendor based on weighted random selection if rules exist.
   */
  private async checkLoadDistribution(
    customerId: string,
    mcc: string,
    mnc: string,
    availableVendorIds: string[],
  ): Promise<RouteResult | null> {
    const db = getEngineDb()

    const { data: rules } = await db
      .from('load_distributions')
      .select('vendor_id, load_percentage')
      .eq('customer_id', customerId)
      .eq('mcc', mcc)
      .eq('mnc', mnc)
      .eq('active', true)
      .in('vendor_id', availableVendorIds)

    if (!rules || rules.length === 0) return null

    // Weighted random selection
    const total = rules.reduce((sum, r) => sum + (r.load_percentage ?? 0), 0)
    let rand = Math.random() * total
    for (const rule of rules) {
      rand -= rule.load_percentage ?? 0
      if (rand <= 0) {
        const vendor = sessionManager.getVendor(rule.vendor_id)
        if (!vendor) continue
        return {
          vendorId: rule.vendor_id,
          vendorName: vendor.vendorName,
          vendorRate: 0, // Will be filled by billing engine
          routeId: '',
        }
      }
    }
    return null
  }
}
