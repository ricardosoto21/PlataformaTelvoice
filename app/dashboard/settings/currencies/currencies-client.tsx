'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, DollarSign } from 'lucide-react'

type Currency = {
  id: string
  code: string
  name: string
  symbol: string | null
  rate_to_usd: number | null
  active: boolean
}

export function CurrenciesClient({ initialCurrencies }: { initialCurrencies: Currency[] }) {
  const supabase = createClient()
  const [currencies, setCurrencies] = useState(initialCurrencies)
  const [search, setSearch] = useState('')

  const filtered = currencies.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('currencies').update({ active: !current }).eq('id', id)
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c))
  }

  const updateRate = async (id: string, rate: string) => {
    const parsed = parseFloat(rate.replace(',', '.'))
    if (isNaN(parsed)) return
    await supabase.from('currencies').update({ rate_to_usd: parsed }).eq('id', id)
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, rate_to_usd: parsed } : c))
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search currencies…"
              className="pl-9 h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Rate to USD</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No currencies found
                </TableCell>
              </TableRow>
            )}
            {filtered.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/30">
                <TableCell className="font-mono font-medium">{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{c.symbol ?? '-'}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    defaultValue={Number(c.rate_to_usd ?? 1).toString()}
                    onBlur={e => updateRate(c.id, e.target.value)}
                    className="h-8 w-32 font-mono text-sm"
                  />
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
