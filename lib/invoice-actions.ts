'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InvoiceFormData, InvoiceItemFormData } from '@/lib/types'

export async function getInvoices(type?: 'OUTGOING' | 'INCOMING', filters?: {
  status?: string
  customerId?: string
  vendorId?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, company_name),
      vendor:vendors(id, name)
    `)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters?.vendorId) query = query.eq('vendor_id', filters.vendorId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, company_name, email, address, country),
      vendor:vendors(id, name, email, address, country),
      items:invoice_items(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createInvoice(formData: InvoiceFormData, items: InvoiceItemFormData[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...formData,
      customer_id: formData.customer_id || null,
      vendor_id: formData.vendor_id || null,
      due_date: formData.due_date || null,
      created_by: user?.id,
    })
    .select()
    .single()

  if (invoiceError) throw invoiceError

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(items.map(item => ({ ...item, invoice_id: invoice.id })))

    if (itemsError) throw itemsError
  }

  revalidatePath('/dashboard/invoices')
  return invoice
}

export async function updateInvoice(id: string, formData: Partial<InvoiceFormData>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...formData,
      customer_id: formData.customer_id || null,
      vendor_id: formData.vendor_id || null,
      due_date: formData.due_date || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
  return data
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createClient()

  const extra: Record<string, unknown> = {}
  if (status === 'PAID') extra.paid_at = new Date().toISOString()
  if (status === 'SENT') extra.sent_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('invoices')
    .update({ status, ...extra })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
  return data
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/invoices')
}

export async function upsertInvoiceItems(invoiceId: string, items: InvoiceItemFormData[]) {
  const supabase = await createClient()
  // Delete existing items then re-insert
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)

  if (items.length > 0) {
    const { error } = await supabase
      .from('invoice_items')
      .insert(items.map(item => ({ ...item, invoice_id: invoiceId })))
    if (error) throw error
  }

  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

export async function getInvoiceSummary(type?: 'OUTGOING' | 'INCOMING') {
  const supabase = await createClient()
  let query = supabase.from('invoices').select('status, total, currency')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error

  const summary = {
    total: data.length,
    draft: data.filter(i => i.status === 'DRAFT').length,
    sent: data.filter(i => i.status === 'SENT').length,
    paid: data.filter(i => i.status === 'PAID').length,
    overdue: data.filter(i => i.status === 'OVERDUE').length,
    totalAmount: data.reduce((sum, i) => sum + (i.total || 0), 0),
    paidAmount: data.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.total || 0), 0),
    pendingAmount: data.filter(i => ['DRAFT', 'SENT'].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0),
    overdueAmount: data.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + (i.total || 0), 0),
  }
  return summary
}
