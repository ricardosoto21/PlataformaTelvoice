import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CurrenciesClient } from './currencies-client'

export default async function CurrenciesPage() {
  const supabase = await createClient()

  const { data: currencies } = await supabase
    .from('currencies')
    .select('*')
    .order('code', { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Currencies</h1>
          <p className="text-muted-foreground">Supported currencies and exchange rates</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currencies?.filter(c => c.active).length ?? 0} active</span>
          <span className="text-border">·</span>
          <span>{currencies?.length ?? 0} total</span>
        </div>
      </div>
      <CurrenciesClient initialCurrencies={currencies ?? []} />
    </div>
  )
}
