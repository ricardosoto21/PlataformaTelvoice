'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  SUCCESS: 'bg-green-500/10 text-green-500 border-green-500/20',
  FAILED:  'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function HlrLookupPage() {
  const [history, setHistory] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [msisdn, setMsisdn] = useState('')
  const [providerId, setProviderId] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('hlr_requests').select('*, hlr_providers(name)').order('created_at', { ascending: false }).limit(100)
    setHistory(data ?? [])
    const { data: p } = await supabase.from('hlr_providers').select('id, name').eq('active', true)
    setProviders(p ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!msisdn.trim()) return
    setLoading(true)

    // Insert a pending lookup record (actual HLR query would be done by the SMPP engine)
    const { error } = await supabase.from('hlr_requests').insert({
      msisdn: msisdn.trim(),
      provider_id: providerId || null,
      status: 'PENDING',
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('HLR lookup queued')
    setMsisdn('')
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HLR Lookup</h1>
        <p className="text-muted-foreground">Query MNP and roaming data for phone numbers</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Run HLR Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex flex-wrap gap-4 items-end">
            <div className="grid gap-2 flex-1 min-w-48">
              <Label>MSISDN (E.164)</Label>
              <Input
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder="+5213341234567"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2 w-56">
              <Label>Provider</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger><SelectValue placeholder="Auto (by dip rules)" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading || !msisdn}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Lookup
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Lookup History</CardTitle>
          <CardDescription>Last 100 requests</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>MSISDN</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>MCC</TableHead>
                <TableHead>MNC</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Ported</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!history.length ? (
                <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">No lookups yet</TableCell></TableRow>
              ) : (
                history.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.msisdn}</TableCell>
                    <TableCell>{r.hlr_providers?.name ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{r.mcc ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{r.mnc ?? '-'}</TableCell>
                    <TableCell>{r.country ?? '-'}</TableCell>
                    <TableCell>{r.operator ?? '-'}</TableCell>
                    <TableCell>
                      {r.ported == null ? '-' : r.ported
                        ? <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Ported</Badge>
                        : <Badge variant="outline">Native</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">${Number(r.cost).toFixed(6)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'MM/dd HH:mm:ss')}
                    </TableCell>
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
