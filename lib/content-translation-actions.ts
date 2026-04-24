'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ContentTranslationFormData } from '@/lib/types'

export async function getContentTranslations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_translations')
    .select('*, customer:customers(id, name, ref_number)')
    .order('priority', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function getContentTranslation(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_translations')
    .select('*, customer:customers(id, name, ref_number)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createContentTranslation(formData: ContentTranslationFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
    created_by: user?.id,
  }

  const { error } = await supabase.from('content_translations').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/content-translations')
}

export async function updateContentTranslation(id: string, formData: ContentTranslationFormData) {
  const supabase = await createClient()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
  }

  const { error } = await supabase.from('content_translations').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/content-translations')
}

export async function deleteContentTranslation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('content_translations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/content-translations')
}

export async function toggleContentTranslation(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('content_translations').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/content-translations')
}
