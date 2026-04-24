'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { VendorFormData } from '@/lib/types'

export async function getVendors() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vendors:', error)
    return []
  }

  return data
}

export async function getVendor(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vendor:', error)
    return null
  }

  return data
}

export async function createVendor(formData: VendorFormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      ...formData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating vendor:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/vendors')
  return { data }
}

export async function updateVendor(id: string, formData: Partial<VendorFormData>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vendors')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vendor:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/vendors')
  revalidatePath(`/dashboard/vendors/${id}`)
  return { data }
}

export async function deleteVendor(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vendor:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/vendors')
  return { success: true }
}

export async function updateVendorConnectionStatus(
  id: string, 
  status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'
) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('vendors')
    .update({ 
      connection_status: status,
      last_connected_at: status === 'CONNECTED' ? new Date().toISOString() : undefined
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating vendor status:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/vendors')
  return { success: true }
}
