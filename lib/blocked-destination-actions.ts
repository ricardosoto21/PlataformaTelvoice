'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BlockedDestinationFormData } from '@/lib/types'

export async function getBlockedDestinations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blocked_destinations')
    .select('*, customer:customers(id, name, ref_number), vendor:vendors(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getBlockedDestination(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blocked_destinations')
    .select('*, customer:customers(id, name, ref_number), vendor:vendors(id, name)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createBlockedDestination(formData: BlockedDestinationFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
    vendor_id: formData.scope === 'VENDOR' ? formData.vendor_id || null : null,
    mnc: formData.mnc || null,
    created_by: user?.id,
  }

  const { error } = await supabase.from('blocked_destinations').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/blocked-destinations')
}

export async function updateBlockedDestination(id: string, formData: BlockedDestinationFormData) {
  const supabase = await createClient()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
    vendor_id: formData.scope === 'VENDOR' ? formData.vendor_id || null : null,
    mnc: formData.mnc || null,
  }

  const { error } = await supabase.from('blocked_destinations').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/blocked-destinations')
}

export async function deleteBlockedDestination(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('blocked_destinations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/blocked-destinations')
}

export async function toggleBlockedDestination(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('blocked_destinations').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/blocked-destinations')
}
