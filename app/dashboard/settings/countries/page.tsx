import { createClient } from '@/lib/supabase/server'
import { CountriesClient } from './countries-client'

export default async function CountriesPage() {
  const supabase = await createClient()

  const { data: countries } = await supabase
    .from('countries')
    .select('*')
    .order('name', { ascending: true })

  const activeCount = countries?.filter(c => c.active).length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Country Settings</h1>
          <p className="text-muted-foreground">Enable or disable routing to specific countries</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{activeCount} active</span>
          <span className="text-border">·</span>
          <span>{countries?.length ?? 0} total</span>
        </div>
      </div>
      <CountriesClient initialCountries={countries ?? []} />
    </div>
  )
}
