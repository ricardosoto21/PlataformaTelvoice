'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Globe } from 'lucide-react'

type Country = {
  id: string
  code: string
  name: string
  mcc: string | null
  dial_code: string | null
  region: string | null
  active: boolean
}

const REGIONS = ['ALL', 'AMER', 'EMEA', 'APAC', 'AFRICA', 'MENA']

const regionColor: Record<string, string> = {
  AMER:   'bg-blue-500/10 text-blue-600 border-blue-500/20',
  EMEA:   'bg-purple-500/10 text-purple-600 border-purple-500/20',
  APAC:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  AFRICA: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  MENA:   'bg-rose-500/10 text-rose-600 border-rose-500/20',
}

export function CountriesClient({ initialCountries }: { initialCountries: Country[] }) {
  const supabase = createClient()
  const [countries, setCountries] = useState(initialCountries)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('ALL')

  const filtered = countries.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.mcc ?? '').includes(search)
    const matchRegion = region === 'ALL' || c.region === region
    return matchSearch && matchRegion
  })

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('countries').update({ active: !current }).eq('id', id)
    setCountries(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c))
  }

  const toggleAll = async (value: boolean) => {
    const ids = filtered.map(c => c.id)
    await supabase.from('countries').update({ active: value }).in('id', ids)
    setCountries(prev => prev.map(c => ids.includes(c.id) ? { ...c, active: value } : c))
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search country, MCC…"
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(r => (
                  <SelectItem key={r} value={r}>{r === 'ALL' ? 'All Regions' : r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAll(true)}
              className="text-xs text-primary hover:underline px-1"
            >
              Enable all
            </button>
            <span className="text-border">·</span>
            <button
              onClick={() => toggleAll(false)}
              className="text-xs text-muted-foreground hover:underline px-1"
            >
              Disable all
            </button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Country</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>MCC</TableHead>
              <TableHead>Dial</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No countries found
                </TableCell>
              </TableRow>
            )}
            {filtered.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{c.mcc ?? '-'}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{c.dial_code ?? '-'}</TableCell>
                <TableCell>
                  {c.region
                    ? <Badge variant="outline" className={regionColor[c.region] ?? ''}>{c.region}</Badge>
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell>
                  <Switch
                    checked={c.active}
                    onCheckedChange={() => toggleActive(c.id, c.active)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
