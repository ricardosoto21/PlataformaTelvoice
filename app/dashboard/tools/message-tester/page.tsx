'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  QUEUED:     'bg-slate-500/10 text-slate-500 border-slate-500/20',
  SENT:       'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DELIVERED:  'bg-green-500/10 text-green-500 border-green-500/20',
  FAILED:     'bg-red-500/10 text-red-500 border-red-500/20',
  UNDELIVERED:'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

export default function MessageTesterPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ customer_id: '', from: '', to: '', text: '' })
  const supabase = createClient()

  async function load() {
    const { data: c } = await supabase.from('customers').select('id, name').eq('active', true)
    const { data: h } = await supabase.from('test_messages').select('*, customers(name)').order('created_at', { ascending: false }).limit(50)
    setCustomers(c ?? [])
    setHistory(h ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('test_messages').insert({
      customer_id: form.customer_id || null,
      from_number: form.from,
      to_number: form.to,
      text: form.text,
      status: 'QUEUED',
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Test message queued')
    setForm({ ...form, to: '', text: '' })
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Message Tester</h1>
        <p className="text-muted-foreground">Send test SMS messages through the platform routing engine</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Send Test Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Customer Account</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>From (Sender ID)</Label>
                <Input className="font-mono" placeholder="TestSender" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>To (MSISDN) *</Label>
                <Input required className="font-mono" placeholder="+5213341234567" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Message Text *</Label>
              <Textarea required rows={4} placeholder="Hello, this is a test message!" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{form.text.length} characters</span>
                <span>{Math.ceil(form.text.length / 160)} SMS part{Math.ceil(form.text.length / 160) !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !form.to || !form.text}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Test
              </Button>
              <Button type="button" variant="outline" onClick={load}>
                <RefreshCw className="mr-2 h-4 w-4" />Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Test History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>DLR Status</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!history.length ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No test messages yet</TableCell></TableRow>
              ) : (
                history.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.customers?.name ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.from_number}</TableCell>
                    <TableCell className="font-mono text-xs">{m.to_number}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{m.text}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_COLORS[m.status]}>{m.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{m.dlr_status ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(m.created_at), 'MM/dd HH:mm:ss')}
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
