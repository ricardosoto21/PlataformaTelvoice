import { notFound } from 'next/navigation'
import { AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSenderId } from '@/lib/sender-id-actions'
import SenderIdForm from '@/components/sender-id-form'

export default async function EditSenderIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [senderIdRecord, supabase] = await Promise.all([getSenderId(id), createClient()])
  if (!senderIdRecord) notFound()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, ref_number')
    .eq('active', true)
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AtSign className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Sender ID</h1>
          <p className="text-sm text-muted-foreground font-mono">{senderIdRecord.sender_id}</p>
        </div>
      </div>
      <SenderIdForm senderIdRecord={senderIdRecord as any} customers={customers ?? []} />
    </div>
  )
}
