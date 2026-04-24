import { createClient } from '@/lib/supabase/server'
import { OperatorsClient } from './operators-client'

export default async function OperatorsPage() {
  const supabase = await createClient()

  const { data: operators, count } = await supabase
    .from('network_operators')
    .select('*', { count: 'exact' })
    .order('country', { ascending: true })
    .order('mcc', { ascending: true })
    .limit(500)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Network Operators</h1>
          <p className="text-muted-foreground">MCC/MNC prefix database for carrier identification</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {count ?? 0} operators
        </div>
      </div>
      <OperatorsClient initialOperators={operators ?? []} />
    </div>
  )
}
