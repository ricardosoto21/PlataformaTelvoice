'use server'

import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  totalCustomers: number
  activeCustomers: number
  totalVendors: number
  connectedVendors: number
  totalSmppAccounts: number
  activeSmppAccounts: number
  totalRatePlans: number
  totalRoutes: number
}

export interface TrafficStats {
  date: string
  submitted: number
  delivered: number
  failed: number
  rejected: number
}

export interface VendorTraffic {
  name: string
  messages: number
  delivered: number
  deliveryRate: number
}

export interface CustomerTraffic {
  name: string
  refNumber: string
  messages: number
  revenue: number
}

export interface RecentActivity {
  id: string
  type: 'customer_created' | 'vendor_connected' | 'rate_plan_updated' | 'route_created' | 'balance_recharge'
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const [
    customersResult,
    vendorsResult,
    smppAccountsResult,
    ratePlansResult,
    routesResult,
  ] = await Promise.all([
    supabase.from('customers').select('id, active', { count: 'exact' }),
    supabase.from('vendors').select('id, active, connection_status', { count: 'exact' }),
    supabase.from('smpp_accounts').select('id, active', { count: 'exact' }),
    supabase.from('rate_plans').select('id', { count: 'exact' }),
    supabase.from('routes').select('id', { count: 'exact' }),
  ])

  const customers = customersResult.data || []
  const vendors = vendorsResult.data || []
  const smppAccounts = smppAccountsResult.data || []

  return {
    totalCustomers: customersResult.count || 0,
    activeCustomers: customers.filter(c => c.active).length,
    totalVendors: vendorsResult.count || 0,
    connectedVendors: vendors.filter(v => v.connection_status === 'CONNECTED').length,
    totalSmppAccounts: smppAccountsResult.count || 0,
    activeSmppAccounts: smppAccounts.filter(s => s.active).length,
    totalRatePlans: ratePlansResult.count || 0,
    totalRoutes: routesResult.count || 0,
  }
}

export async function getTrafficStats(days: number = 7): Promise<TrafficStats[]> {
  // Generate mock data for traffic stats since we don't have actual message logs yet
  const stats: TrafficStats[] = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    const submitted = Math.floor(Math.random() * 50000) + 10000
    const deliveryRate = 0.85 + Math.random() * 0.12
    const delivered = Math.floor(submitted * deliveryRate)
    const failedRate = Math.random() * 0.08
    const failed = Math.floor(submitted * failedRate)
    const rejected = submitted - delivered - failed
    
    stats.push({
      date: date.toISOString().split('T')[0],
      submitted,
      delivered,
      failed,
      rejected: Math.max(0, rejected),
    })
  }
  
  return stats
}

export async function getVendorTrafficStats(): Promise<VendorTraffic[]> {
  const supabase = await createClient()
  
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, connection_status')
    .eq('active', true)
    .limit(10)
  
  if (!vendors || vendors.length === 0) {
    return []
  }
  
  // Mock traffic data per vendor
  return vendors.map(vendor => {
    const messages = Math.floor(Math.random() * 100000) + 5000
    const deliveryRate = 0.88 + Math.random() * 0.10
    return {
      name: vendor.name,
      messages,
      delivered: Math.floor(messages * deliveryRate),
      deliveryRate: deliveryRate * 100,
    }
  })
}

export async function getTopCustomers(limit: number = 5): Promise<CustomerTraffic[]> {
  const supabase = await createClient()
  
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, ref_number, balance')
    .eq('active', true)
    .order('balance', { ascending: false })
    .limit(limit)
  
  if (!customers || customers.length === 0) {
    return []
  }
  
  // Mock traffic data per customer
  return customers.map(customer => ({
    name: customer.name,
    refNumber: customer.ref_number,
    messages: Math.floor(Math.random() * 200000) + 10000,
    revenue: Math.floor(Math.random() * 5000) + 500,
  }))
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  const supabase = await createClient()
  
  // Get recent customers
  const { data: recentCustomers } = await supabase
    .from('customers')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(3)
  
  // Get recent vendors
  const { data: recentVendors } = await supabase
    .from('vendors')
    .select('id, name, created_at, connection_status')
    .order('created_at', { ascending: false })
    .limit(3)
  
  // Get recent rate plans
  const { data: recentRatePlans } = await supabase
    .from('rate_plans')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(2)
  
  // Get recent routes
  const { data: recentRoutes } = await supabase
    .from('routes')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(2)
  
  const activities: RecentActivity[] = []
  
  recentCustomers?.forEach(customer => {
    activities.push({
      id: customer.id,
      type: 'customer_created',
      description: `New customer "${customer.name}" created`,
      timestamp: customer.created_at,
    })
  })
  
  recentVendors?.forEach(vendor => {
    activities.push({
      id: vendor.id,
      type: 'vendor_connected',
      description: `Vendor "${vendor.name}" ${vendor.connection_status === 'CONNECTED' ? 'connected' : 'added'}`,
      timestamp: vendor.created_at,
    })
  })
  
  recentRatePlans?.forEach(plan => {
    activities.push({
      id: plan.id,
      type: 'rate_plan_updated',
      description: `Rate plan "${plan.name}" created`,
      timestamp: plan.created_at,
    })
  })
  
  recentRoutes?.forEach(route => {
    activities.push({
      id: route.id,
      type: 'route_created',
      description: `Route "${route.name}" configured`,
      timestamp: route.created_at,
    })
  })
  
  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  return activities.slice(0, limit)
}

export interface BSSStats {
  totalRevenue: number
  totalCost: number
  profit: number
  profitMargin: number
  pendingInvoices: number
  overdueBalance: number
}

export async function getBSSStats(): Promise<BSSStats> {
  // Mock BSS stats - in production this would come from actual billing data
  const totalRevenue = Math.floor(Math.random() * 50000) + 25000
  const totalCost = Math.floor(totalRevenue * (0.4 + Math.random() * 0.2))
  const profit = totalRevenue - totalCost
  
  return {
    totalRevenue,
    totalCost,
    profit,
    profitMargin: (profit / totalRevenue) * 100,
    pendingInvoices: Math.floor(Math.random() * 15) + 3,
    overdueBalance: Math.floor(Math.random() * 5000) + 500,
  }
}
