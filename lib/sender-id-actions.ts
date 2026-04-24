'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SenderIdFormData } from '@/lib/types'

export async function getSenderIds() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sender_ids')
    .select('*, customer:customers(id, name, ref_number)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getSenderId(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sender_ids')
    .select('*, customer:customers(id, name, ref_number)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createSenderId(formData: SenderIdFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
    created_by: user?.id,
  }

  const { error } = await supabase.from('sender_ids').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sender-ids')
}

export async function updateSenderId(id: string, formData: SenderIdFormData) {
  const supabase = await createClient()

  const payload = {
    ...formData,
    customer_id: formData.scope === 'CUSTOMER' ? formData.customer_id || null : null,
  }

  const { error } = await supabase.from('sender_ids').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sender-ids')
}

export async function deleteSenderId(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sender_ids').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sender-ids')
}

export async function toggleSenderId(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('sender_ids').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/sender-ids')
}
