'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CustomerFormData } from '@/lib/types'

export async function getCustomers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data
}

export async function getCustomer(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching customer:', error)
    return null
  }

  return data
}

export async function createCustomer(formData: CustomerFormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...formData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { data }
}

export async function updateCustomer(id: string, formData: Partial<CustomerFormData>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${id}`)
  return { data }
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function generateRefNumber() {
  const supabase = await createClient()
  
  // Get the count of customers to generate a sequential reference
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  const nextNumber = (count || 0) + 1
  return `CUST-${String(nextNumber).padStart(6, '0')}`
}
