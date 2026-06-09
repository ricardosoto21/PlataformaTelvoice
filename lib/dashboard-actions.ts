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

type MessageSummaryRow = {
  status: string | null
  submitted_at?: string | null
  message_parts: number | null
  customer_rate?: number | null
  vendor_rate?: number | null
}

type VendorMessageRow = MessageSummaryRow & {
  vendor_id: string | null
  vendor: { name: string | null } | { name: string | null }[] | null
}

type CustomerMessageRow = MessageSummaryRow & {
  customer_id: string | null
  customer: { name: string | null; ref_number: string | null } | { name: string | null; ref_number: string | null }[] | null
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getMessageUnits(row: { message_parts?: number | null }) {
  return Math.max(1, Number(row.message_parts) || 1)
}

function getLineAmount(rate: number | null | undefined, row: { message_parts?: number | null }) {
  return (Number(rate) || 0) * getMessageUnits(row)
}

function isDelivered(status: string | null | undefined) {
  return status === 'DELIVERED'
}

function isFailed(status: string | null | undefined) {
  return status === 'FAILED' || status === 'EXPIRED'
}

function isRejected(status: string | null | undefined) {
  return status === 'REJECTED'
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
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - Math.max(days - 1, 0))
  startDate.setHours(0, 0, 0, 0)

  const statsByDate = new Map<string, TrafficStats>()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = getDateKey(date)
    statsByDate.set(key, { date: key, submitted: 0, delivered: 0, failed: 0, rejected: 0 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('status, submitted_at, message_parts')
    .gte('submitted_at', startDate.toISOString())

  if (error) {
    console.error('Error fetching traffic stats:', error)
    return Array.from(statsByDate.values())
  }

  for (const message of (data ?? []) as MessageSummaryRow[]) {
    if (!message.submitted_at) continue
    const key = getDateKey(new Date(message.submitted_at))
    const bucket = statsByDate.get(key)
    if (!bucket) continue

    const units = getMessageUnits(message)
    bucket.submitted += units
    if (isDelivered(message.status)) bucket.delivered += units
    if (isFailed(message.status)) bucket.failed += units
    if (isRejected(message.status)) bucket.rejected += units
  }

  return Array.from(statsByDate.values())
}

export async function getVendorTrafficStats(): Promise<VendorTraffic[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from('messages')
    .select('vendor_id, status, message_parts, vendor:vendors(name)')
    .not('vendor_id', 'is', null)
    .gte('submitted_at', since.toISOString())

  if (error) {
    console.error('Error fetching vendor traffic:', error)
    return []
  }

  const grouped = new Map<string, VendorTraffic>()
  for (const row of (data ?? []) as unknown as VendorMessageRow[]) {
    if (!row.vendor_id) continue
    const units = getMessageUnits(row)
    const vendor = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor
    const current = grouped.get(row.vendor_id) ?? {
      name: vendor?.name ?? 'Unknown vendor',
      messages: 0,
      delivered: 0,
      deliveryRate: 0,
    }
    current.messages += units
    if (isDelivered(row.status)) current.delivered += units
    current.deliveryRate = current.messages > 0 ? (current.delivered / current.messages) * 100 : 0
    grouped.set(row.vendor_id, current)
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 10)
}

export async function getTopCustomers(limit: number = 5): Promise<CustomerTraffic[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from('messages')
    .select('customer_id, status, message_parts, customer_rate, customer:customers(name, ref_number)')
    .not('customer_id', 'is', null)
    .gte('submitted_at', since.toISOString())

  if (error) {
    console.error('Error fetching top customers:', error)
    return []
  }

  const grouped = new Map<string, CustomerTraffic>()
  for (const row of (data ?? []) as unknown as CustomerMessageRow[]) {
    if (!row.customer_id) continue
    const units = getMessageUnits(row)
    const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer
    const current = grouped.get(row.customer_id) ?? {
      name: customer?.name ?? 'Unknown customer',
      refNumber: customer?.ref_number ?? '-',
      messages: 0,
      revenue: 0,
    }
    current.messages += units
    current.revenue += getLineAmount(row.customer_rate, row)
    grouped.set(row.customer_id, current)
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.messages - a.messages)
    .slice(0, limit)
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
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [{ data: messages, error: messagesError }, { data: invoices, error: invoicesError }] = await Promise.all([
    supabase
      .from('messages')
      .select('customer_rate, vendor_rate, message_parts')
      .gte('submitted_at', since.toISOString()),
    supabase
      .from('invoices')
      .select('status, total')
      .in('status', ['DRAFT', 'SENT', 'OVERDUE']),
  ])

  if (messagesError) console.error('Error fetching BSS message stats:', messagesError)
  if (invoicesError) console.error('Error fetching BSS invoice stats:', invoicesError)

  const messageRows = (messages ?? []) as MessageSummaryRow[]
  const invoiceRows = (invoices ?? []) as { status: string | null; total: number | null }[]

  const totalRevenue = messageRows.reduce((sum, row) => sum + getLineAmount(row.customer_rate, row), 0)
  const totalCost = messageRows.reduce((sum, row) => sum + getLineAmount(row.vendor_rate, row), 0)
  const profit = totalRevenue - totalCost
  const pendingInvoices = invoiceRows.filter((invoice) => invoice.status === 'DRAFT' || invoice.status === 'SENT').length
  const overdueBalance = invoiceRows
    .filter((invoice) => invoice.status === 'OVERDUE')
    .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0)
  
  return {
    totalRevenue,
    totalCost,
    profit,
    profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
    pendingInvoices,
    overdueBalance,
  }
}
