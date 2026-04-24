'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Network } from 'lucide-react'

type Operator = {
  id: string
  mcc: string
  mnc: string
  country: string
  network_name?: string | null
  operator?: string | null
  active?: boolean | null
}

export function OperatorsClient({ initialOperators }: { initialOperators: Operator[] }) {
  const [search, setSearch] = useState('')

  const filtered = initialOperators.filter(op => {
    const q = search.toLowerCase()
    return (
      op.mcc.includes(q) ||
      op.mnc.includes(q) ||
      (op.country ?? '').toLowerCase().includes(q) ||
      (op.network_name ?? op.operator ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search MCC, MNC, country, operator…"
              className="pl-9 h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground shrink-0">{filtered.length} results</span>
        </div>
        <div className="max-h-[560px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>MCC</TableHead>
                <TableHead>MNC</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Operator / Network</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                    No operators found
                  </TableCell>
                </TableRow>
              )}
              {filtered.slice(0, 300).map(op => (
                <TableRow key={op.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-medium">{op.mcc}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{op.mnc}</TableCell>
                  <TableCell>{op.country}</TableCell>
                  <TableCell className="text-sm">{op.network_name ?? op.operator ?? '—'}</TableCell>
                  <TableCell>
                    {op.active === false
                      ? <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      : <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>
                    }
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length > 300 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-3">
                    Showing 300 of {filtered.length} — refine your search to see more
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
