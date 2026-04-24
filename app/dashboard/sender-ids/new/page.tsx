import { AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SenderIdForm from '@/components/sender-id-form'

export default async function NewSenderIdPage() {
  const supabase = await createClient()
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
          <h1 className="text-2xl font-semibold text-foreground">Add Sender ID</h1>
          <p className="text-sm text-muted-foreground">Register a new allowed sender identifier</p>
        </div>
      </div>
      <SenderIdForm customers={customers ?? []} />
    </div>
  )
}
