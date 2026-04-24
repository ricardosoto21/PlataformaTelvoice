'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { BlockListFormData } from '@/lib/types'

export async function getBlockLists() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('block_lists')
    .select('*, customer:customers(id, name, ref_number)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getBlockList(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('block_lists')
    .select('*, customer:customers(id, name, ref_number)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createBlockList(formData: BlockListFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
    created_by: user?.id,
  }

  const { error } = await supabase.from('block_lists').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/block-lists')
}

export async function updateBlockList(id: string, formData: BlockListFormData) {
  const supabase = await createClient()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
  }

  const { error } = await supabase.from('block_lists').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/block-lists')
}

export async function deleteBlockList(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('block_lists').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/block-lists')
}

export async function toggleBlockList(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('block_lists').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/block-lists')
}
