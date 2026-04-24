import { notFound } from 'next/navigation'
import { ShieldX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBlockList } from '@/lib/block-list-actions'
import BlockListForm from '@/components/block-list-form'

export default async function EditBlockListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [blockList, supabase] = await Promise.all([getBlockList(id), createClient()])
  if (!blockList) notFound()

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
          <h1 className="text-2xl font-semibold text-foreground">Edit Block Rule</h1>
          <p className="text-sm text-muted-foreground">{blockList.name}</p>
        </div>
      </div>
      <BlockListForm blockList={blockList as any} customers={customers ?? []} />
    </div>
  )
}
