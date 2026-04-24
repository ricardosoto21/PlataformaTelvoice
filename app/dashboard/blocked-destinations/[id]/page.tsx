import { notFound } from 'next/navigation'
import { Ban } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBlockedDestination } from '@/lib/blocked-destination-actions'
import BlockedDestinationForm from '@/components/blocked-destination-form'

export default async function EditBlockedDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [destination, { data: customers }, { data: vendors }] = await Promise.all([
    getBlockedDestination(id),
    supabase.from('customers').select('id, name, ref_number').eq('active', true).order('name'),
    supabase.from('vendors').select('id, name').eq('active', true).order('name'),
  ])
  if (!destination) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
          <Ban className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Blocked Destination</h1>
          <p className="text-sm text-muted-foreground font-mono">MCC {destination.mcc} / MNC {destination.mnc ?? '*'}</p>
        </div>
      </div>
      <BlockedDestinationForm destination={destination as any} customers={customers ?? []} vendors={vendors ?? []} />
    </div>
  )
}
