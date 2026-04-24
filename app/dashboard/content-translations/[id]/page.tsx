import { notFound } from 'next/navigation'
import { Languages } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getContentTranslation } from '@/lib/content-translation-actions'
import ContentTranslationForm from '@/components/content-translation-form'

export default async function EditContentTranslationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [rule, supabase] = await Promise.all([getContentTranslation(id), createClient()])
  if (!rule) notFound()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, ref_number')
    .eq('active', true)
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Languages className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Content Rule</h1>
          <p className="text-sm text-muted-foreground">{rule.name}</p>
        </div>
      </div>
      <ContentTranslationForm rule={rule as any} customers={customers ?? []} />
    </div>
  )
}
