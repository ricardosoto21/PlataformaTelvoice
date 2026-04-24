'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { RouteFormData } from '@/lib/types'

export async function getRoutes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      rate_plan:rate_plans(id, name, currency)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getRoute(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      rate_plan:rate_plans(id, name, currency)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createRoute(formData: RouteFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('routes')
    .insert({
      ...formData,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/routes')
  return data
}

export async function updateRoute(id: string, formData: RouteFormData) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('routes')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dashboard/routes')
  return data
}

export async function deleteRoute(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dashboard/routes')
}
