'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function MccMncFinderPage() {
  const [records, setRecords] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('mcc_mnc').select('*').order('country').order('mcc').then(({ data }) => setRecords(data ?? []))
  }, [])

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.mcc.includes(q) ||
      r.mnc.includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.operator.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">MCC/MNC Finder</h1>
        <p className="text-muted-foreground">Search mobile country and network codes globally</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">MCC/MNC Directory</CardTitle>
              <CardDescription>{filtered.length} of {records.length} networks</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search country, operator, MCC, MNC..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">MCC</TableHead>
                <TableHead className="w-24">MNC</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    {search ? `No results for "${search}"` : "Type to search networks"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono font-bold">{r.mcc}</TableCell>
                    <TableCell className="font-mono">{r.mnc}</TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell>{r.operator}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
