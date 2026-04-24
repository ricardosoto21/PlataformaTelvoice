'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReportFilters, ReportSummary } from '@/lib/types'

export async function getFinanceReport(filters: ReportFilters) {
  const supabase = await createClient()
  
  let query = supabase
    .from('messages')
    .select('*')
    .order('submitted_at', { ascending: false })
  
  if (filters.startDate) {
    query = query.gte('submitted_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('submitted_at', filters.endDate)
  }
  if (filters.customerId && filters.customerId !== 'all') {
    query = query.eq('customer_id', filters.customerId)
  }
  if (filters.vendorId && filters.vendorId !== 'all') {
    query = query.eq('vendor_id', filters.vendorId)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query.limit(1000)

  if (error) {
    console.error('Error fetching finance report:', error)
    return { messages: [], summary: null }
  }
  
  const summary: ReportSummary = {
    totalMessages: data?.length || 0,
    delivered: data?.filter(m => m.status === 'DELIVERED').length || 0,
    failed: data?.filter(m => m.status === 'FAILED' || m.status === 'REJECTED').length || 0,
    deliveryRate: data?.length ? (data.filter(m => m.status === 'DELIVERED').length / data.length) * 100 : 0,
    totalRevenue: data?.reduce((sum, m) => sum + (Number(m.customer_rate) || 0), 0) || 0,
    totalCost: data?.reduce((sum, m) => sum + (Number(m.vendor_rate) || 0), 0) || 0,
    profit: data?.reduce((sum, m) => sum + ((Number(m.customer_rate) || 0) - (Number(m.vendor_rate) || 0)), 0) || 0,
    margin: 0
  }
  summary.margin = summary.totalRevenue > 0 ? (summary.profit / summary.totalRevenue) * 100 : 0
  
  return { messages: data || [], summary }
}

export async function getRetailReport(filters: ReportFilters) {
  const supabase = await createClient()
  
  let query = supabase
    .from('messages')
    .select(`
      *,
      customer:customers(id, name, ref_number, type)
    `)
    .order('submitted_at', { ascending: false })
  
  if (filters.startDate) {
    query = query.gte('submitted_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('submitted_at', filters.endDate)
  }
  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }
  if (filters.country) {
    query = query.eq('country', filters.country)
  }
  
  const { data, error } = await query.limit(1000)
  
  if (error) {
    console.error('Error fetching retail report:', error)
    return { messages: [], byCustomer: [] }
  }
  
  // Group by customer
  const customerMap = new Map<string, { customer: any; count: number; revenue: number; delivered: number }>()
  
  data?.forEach(msg => {
    if (msg.customer_id) {
      const existing = customerMap.get(msg.customer_id) || { 
        customer: msg.customer, 
        count: 0, 
        revenue: 0, 
        delivered: 0 
      }
      existing.count++
      existing.revenue += Number(msg.customer_rate) || 0
      if (msg.status === 'DELIVERED') existing.delivered++
      customerMap.set(msg.customer_id, existing)
    }
  })
  
  const byCustomer = Array.from(customerMap.values())
    .sort((a, b) => b.count - a.count)
  
  return { messages: data || [], byCustomer }
}

export async function getWholesaleReport(filters: ReportFilters) {
  const supabase = await createClient()
  
  let query = supabase
    .from('messages')
    .select(`
      *,
      customer:customers(id, name, ref_number, type)
    `)
    .order('submitted_at', { ascending: false })
  
  // Filter for wholesale customers only
  if (filters.startDate) {
    query = query.gte('submitted_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('submitted_at', filters.endDate)
  }
  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }
  if (filters.mcc) {
    query = query.eq('mcc', filters.mcc)
  }
  
  const { data, error } = await query.limit(1000)
  
  if (error) {
    console.error('Error fetching wholesale report:', error)
    return { messages: [], byDestination: [] }
  }
  
  // Group by destination (MCC/MNC)
  const destMap = new Map<string, { mcc: string; mnc: string; country: string; operator: string; count: number; revenue: number; cost: number }>()
  
  data?.forEach(msg => {
    if (msg.mcc) {
      const key = `${msg.mcc}-${msg.mnc || 'ALL'}`
      const existing = destMap.get(key) || { 
        mcc: msg.mcc, 
        mnc: msg.mnc || 'ALL',
        country: msg.country || 'Unknown',
        operator: msg.operator || 'Unknown',
        count: 0, 
        revenue: 0, 
        cost: 0 
      }
      existing.count++
      existing.revenue += Number(msg.customer_rate) || 0
      existing.cost += Number(msg.vendor_rate) || 0
      destMap.set(key, existing)
    }
  })
  
  const byDestination = Array.from(destMap.values())
    .sort((a, b) => b.count - a.count)
  
  return { messages: data || [], byDestination }
}

export async function getVendorReport(filters: ReportFilters) {
  const supabase = await createClient()
  
  let query = supabase
    .from('messages')
    .select(`
      *,
      vendor:vendors(id, name, connection_status)
    `)
    .order('submitted_at', { ascending: false })
  
  if (filters.startDate) {
    query = query.gte('submitted_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('submitted_at', filters.endDate)
  }
  if (filters.vendorId) {
    query = query.eq('vendor_id', filters.vendorId)
  }
  
  const { data, error } = await query.limit(1000)
  
  if (error) {
    console.error('Error fetching vendor report:', error)
    return { messages: [], byVendor: [] }
  }
  
  // Group by vendor
  const vendorMap = new Map<string, { vendor: any; count: number; cost: number; delivered: number; failed: number }>()
  
  data?.forEach(msg => {
    if (msg.vendor_id) {
      const existing = vendorMap.get(msg.vendor_id) || { 
        vendor: msg.vendor, 
        count: 0, 
        cost: 0, 
        delivered: 0,
        failed: 0
      }
      existing.count++
      existing.cost += Number(msg.vendor_rate) || 0
      if (msg.status === 'DELIVERED') existing.delivered++
      if (msg.status === 'FAILED' || msg.status === 'REJECTED') existing.failed++
      vendorMap.set(msg.vendor_id, existing)
    }
  })
  
  const byVendor = Array.from(vendorMap.values())
    .sort((a, b) => b.count - a.count)
  
  return { messages: data || [], byVendor }
}

export async function getCustomersForFilter() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, ref_number')
    .eq('active', true)
    .order('name')
  return data || []
}

export async function getVendorsForFilter() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('active', true)
    .order('name')
  return data || []
}

export async function getBalanceTransactions(customerId?: string, limit = 50) {
  const supabase = await createClient()
  
  let query = supabase
    .from('balance_transactions')
    .select(`
      *,
      customer:customers(id, name, ref_number)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (customerId) {
    query = query.eq('customer_id', customerId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching balance transactions:', error)
    return []
  }
  
  return data || []
}
