import { ShieldX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BlockListForm from '@/components/block-list-form'

export default async function NewBlockListPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, ref_number')
    .eq('active', true)
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
          <ShieldX className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Block Rule</h1>
          <p className="text-sm text-muted-foreground">Create a keyword, number, or sender ID block</p>
        </div>
      </div>
      <BlockListForm customers={customers ?? []} />
    </div>
  )
}
