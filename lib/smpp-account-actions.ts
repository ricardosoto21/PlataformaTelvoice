'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { encryptPassword } from '@/smpp/crypto'
import type { SmppAccountFormData } from '@/lib/types'

export async function getSmppAccounts() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('smpp_accounts')
    .select(`
      *,
      customer:customers(id, name, ref_number)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching SMPP accounts:', error)
    return []
  }

  return data
}

export async function getSmppAccount(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('smpp_accounts')
    .select(`
      *,
      customer:customers(id, name, ref_number)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching SMPP account:', error)
    return null
  }

  return data
}

export async function createSmppAccount(formData: SmppAccountFormData) {
  const supabase = await createClient()

  // Encrypt password before storing if SMPP_ENCRYPTION_KEY is configured
  const payload = process.env.SMPP_ENCRYPTION_KEY && formData.password
    ? { ...formData, password: encryptPassword(formData.password) }
    : formData

  const { data, error } = await supabase
    .from('smpp_accounts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating SMPP account:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/smpp-accounts')
  return { data }
}

export async function updateSmppAccount(id: string, formData: Partial<SmppAccountFormData>) {
  const supabase = await createClient()

  // Encrypt password before updating if it was changed
  const payload = process.env.SMPP_ENCRYPTION_KEY && formData.password
    ? { ...formData, password: encryptPassword(formData.password) }
    : formData

  const { data, error } = await supabase
    .from('smpp_accounts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating SMPP account:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/smpp-accounts')
  revalidatePath(`/dashboard/smpp-accounts/${id}`)
  return { data }
}

export async function deleteSmppAccount(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('smpp_accounts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting SMPP account:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/smpp-accounts')
  return { success: true }
}

export async function generateSystemId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'TV'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
