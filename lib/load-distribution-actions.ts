'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LoadDistributionFormData } from '@/lib/types'

export async function getLoadDistributions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('load_distributions')
    .select(`
      *,
      customer:customers(id, name, ref_number),
      vendor:vendors(id, name, connection_status)
    `)
    .order('customer_id', { ascending: true })
    .order('mcc', { ascending: true })
    .order('mnc', { ascending: true })

  if (error) throw error
  return data
}

export async function getLoadDistribution(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('load_distributions')
    .select(`
      *,
      customer:customers(id, name, ref_number),
      vendor:vendors(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createLoadDistribution(formData: LoadDistributionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('load_distributions')
    .insert({
      ...formData,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/load-distribution')
  return data
}

export async function updateLoadDistribution(id: string, formData: Partial<LoadDistributionFormData>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('load_distributions')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/load-distribution')
  return data
}

export async function deleteLoadDistribution(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('load_distributions')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/load-distribution')
}

// Get distributions for a specific customer
export async function getLoadDistributionsByCustomer(customerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('load_distributions')
    .select(`
      *,
      vendor:vendors(id, name, connection_status)
    `)
    .eq('customer_id', customerId)
    .order('mcc', { ascending: true })
    .order('mnc', { ascending: true })

  if (error) throw error
  return data
}
