import { createClient } from '@/lib/supabase/server'
import { CurrencyConverterClient } from './currency-converter-client'
import type { CurrencyRecord } from '@/lib/types'

export default async function CurrencyConverterPage() {
  const supabase = await createClient()

  const { data: currencies } = await supabase
    .from('currencies')
    .select('code, name, symbol, rate_to_usd')
    .eq('active', true)
    .order('code', { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Currency Converter</h1>
        <p className="text-muted-foreground">Convert amounts between currencies using platform exchange rates</p>
      </div>
      <CurrencyConverterClient currencies={(currencies ?? []) as CurrencyRecord[]} />
    </div>
  )
}
