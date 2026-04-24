'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LcrRuleFormData, LcrExclusionFormData } from '@/lib/types'

// LCR Rules
export async function getLcrRules() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lcr_rules')
    .select(`
      *,
      vendor:vendors(id, name, connection_status),
      route:routes(id, name)
    `)
    .order('mcc', { ascending: true })
    .order('mnc', { ascending: true })
    .order('priority', { ascending: true })

  if (error) throw error
  return data
}

export async function getLcrRule(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lcr_rules')
    .select(`
      *,
      vendor:vendors(id, name),
      route:routes(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createLcrRule(formData: LcrRuleFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('lcr_rules')
    .insert({
      ...formData,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/lcr')
  return data
}

export async function updateLcrRule(id: string, formData: Partial<LcrRuleFormData>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lcr_rules')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/lcr')
  return data
}

export async function deleteLcrRule(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('lcr_rules')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/lcr')
}

// LCR Exclusions
export async function getLcrExclusions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lcr_exclusions')
    .select(`
      *,
      vendor:vendors(id, name)
    `)
    .order('mcc', { ascending: true })
    .order('mnc', { ascending: true })

  if (error) throw error
  return data
}

export async function createLcrExclusion(formData: LcrExclusionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('lcr_exclusions')
    .insert({
      ...formData,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/lcr')
  return data
}

export async function deleteLcrExclusion(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('lcr_exclusions')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/lcr')
}
