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
import { RefreshCw, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  DONE:     'bg-green-500/10 text-green-500 border-green-500/20',
  FAILED:   'bg-red-500/10 text-red-500 border-red-500/20',
}

const DLR_STATUSES = ['DELIVERED', 'UNDELIVERED', 'ACCEPTED', 'REJECTED', 'UNKNOWN', 'EXPIRED', 'FAILED']

export default function RepushDlrPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ message_id: '', customer_id: '', dlr_status: 'DELIVERED' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('repush_dlr_jobs').select('*, customers(name)').order('created_at', { ascending: false }).limit(50)
    setJobs(data ?? [])
    const { data: c } = await supabase.from('customers').select('id, name').eq('active', true)
    setCustomers(c ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleRepush(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('repush_dlr_jobs').insert({
      message_id: form.message_id.trim() || null,
      customer_id: form.customer_id || null,
      dlr_status: form.dlr_status,
      status: 'PENDING',
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('DLR re-push job created')
    setForm({ message_id: '', customer_id: '', dlr_status: 'DELIVERED' })
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Re-Push DLR</h1>
        <p className="text-muted-foreground">Manually trigger delivery receipt callbacks to customers</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Create Re-Push Job</CardTitle>
          <CardDescription>Re-send a DLR for a specific message or bulk per customer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRepush} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Message ID (optional)</Label>
                <Input className="font-mono" placeholder="Leave blank for customer bulk" value={form.message_id} onChange={(e) => setForm({ ...form, message_id: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Customer (optional)</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All customers" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Force DLR Status *</Label>
                <Select value={form.dlr_status} onValueChange={(v) => setForm({ ...form, dlr_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DLR_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-fit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Create Re-Push Job
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Message ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>DLR Status</TableHead>
                <TableHead>Job Status</TableHead>
                <TableHead>Pushed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!jobs.length ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No re-push jobs yet</TableCell></TableRow>
              ) : (
                jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-mono text-xs">{j.message_id ?? <span className="text-muted-foreground">Bulk</span>}</TableCell>
                    <TableCell>{j.customers?.name ?? <span className="text-muted-foreground">All</span>}</TableCell>
                    <TableCell><Badge variant="outline">{j.dlr_status}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_COLORS[j.status]}>{j.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(j.created_at), 'MM/dd HH:mm:ss')}
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
