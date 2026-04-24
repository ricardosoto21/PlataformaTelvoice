'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { RatePlanFormData, RatePlanEntryFormData } from '@/lib/types'

export async function getRatePlans() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getRatePlan(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createRatePlan(formData: RatePlanFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('rate_plans')
    .insert({
      ...formData,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
  return data
}

export async function updateRatePlan(id: string, formData: RatePlanFormData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plans')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
  return data
}

export async function deleteRatePlan(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('rate_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
}

// Rate Plan Entries
export async function getRatePlanEntries(ratePlanId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plan_entries')
    .select('*')
    .eq('rate_plan_id', ratePlanId)
    .order('country', { ascending: true })

  if (error) throw error
  return data
}

export async function createRatePlanEntry(formData: RatePlanEntryFormData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plan_entries')
    .insert(formData)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
  return data
}

export async function createRatePlanEntriesBulk(entries: RatePlanEntryFormData[]) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plan_entries')
    .insert(entries)
    .select()

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
  return data
}

export async function updateRatePlanEntry(id: string, formData: Partial<RatePlanEntryFormData>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rate_plan_entries')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
  return data
}

export async function deleteRatePlanEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('rate_plan_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
}

export async function deleteAllRatePlanEntries(ratePlanId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('rate_plan_entries')
    .delete()
    .eq('rate_plan_id', ratePlanId)

  if (error) throw error
  revalidatePath('/dashboard/rate-plans')
}
