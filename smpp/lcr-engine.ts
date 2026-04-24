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

    // 2. Standard LCR: query lcr_rules — exact MCC/MNC OR wildcard 000/000
    //    Push the filter to DB rather than filtering in JS to avoid type issues
    const { data: rules, error: rulesError } = await db
      .from('lcr_rules')
      .select(`
        id, mcc, mnc, vendor_id, route_id, priority, cost,
        vendors ( id, name )
      `)
      .eq('active', true)
      .in('vendor_id', availableVendorIds)
      .or(`and(mcc.eq.${params.mcc},mnc.eq.${params.mnc}),and(mcc.eq.000,mnc.eq.000)`)
      .order('priority', { ascending: true })

    console.log(`[lcr] Rules query for MCC=${params.mcc} MNC=${params.mnc}, availableVendors=${availableVendorIds.length}, results=${rules?.length ?? 0}, error=${rulesError?.message ?? 'none'}`)

    if (!rules || rules.length === 0) {
      console.warn(`[lcr] No LCR rules found for MCC ${params.mcc} MNC ${params.mnc}`)
      return null
    }

    // Prefer exact MCC+MNC match over wildcard
    const exactMatches = rules.filter(r => r.mcc === params.mcc && r.mnc === params.mnc)
    const best = exactMatches.length > 0 ? exactMatches[0] : rules[0]

    const vendor = best.vendors as { id: string; name: string } | null
    if (!vendor) {
      console.warn(`[lcr] Rule ${best.id} has no vendor data`)
      return null
    }

    console.log(`[lcr] Routing MCC ${params.mcc} MNC ${params.mnc} → vendor: ${vendor.name} (rule: ${best.mcc}/${best.mnc})`)

    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorRate: best.cost ?? 0,
      routeId: best.route_id ?? '',
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
