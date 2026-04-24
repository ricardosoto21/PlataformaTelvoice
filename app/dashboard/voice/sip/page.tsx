'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const CODEC_OPTIONS = ['G.711 PCMU', 'G.711 PCMA', 'G.729', 'G.722', 'Opus', 'iLBC']

export default function SipAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ customer_id: '', username: '', host: '', port: '5060', transport: 'UDP', codecs: 'G.711 PCMU', max_channels: '10' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('sip_accounts').select('*, customers(name)').order('created_at', { ascending: false })
    setAccounts(data ?? [])
    const { data: c } = await supabase.from('customers').select('id, name').eq('active', true)
    setCustomers(c ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('sip_accounts').insert({
      customer_id: form.customer_id || null,
      username: form.username,
      host: form.host,
      port: parseInt(form.port),
      transport: form.transport,
      codecs: [form.codecs],
      max_channels: parseInt(form.max_channels),
    })
    if (error) { toast.error(error.message); return }
    toast.success('SIP account created')
    setOpen(false)
    setForm({ customer_id: '', username: '', host: '', port: '5060', transport: 'UDP', codecs: 'G.711 PCMU', max_channels: '10' })
    load()
  }

  async function toggleAccount(id: string, active: boolean) {
    await supabase.from('sip_accounts').update({ active }).eq('id', id)
    load()
  }

  async function deleteAccount(id: string) {
    await supabase.from('sip_accounts').delete().eq('id', id)
    toast.success('SIP account deleted')
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SIP Accounts</h1>
          <p className="text-muted-foreground">Manage SIP trunk connections for voice services</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add SIP Account</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add SIP Account</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Username *</Label>
                  <Input required className="font-mono" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="trunk1" />
                </div>
                <div className="grid gap-2">
                  <Label>Transport</Label>
                  <Select value={form.transport} onValueChange={(v) => setForm({ ...form, transport: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['UDP', 'TCP', 'TLS'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 grid gap-2">
                  <Label>SIP Host *</Label>
                  <Input required className="font-mono" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="sip.carrier.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Port</Label>
                  <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Preferred Codec</Label>
                  <Select value={form.codecs} onValueChange={(v) => setForm({ ...form, codecs: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CODEC_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Max Channels</Label>
                  <Input type="number" min={1} value={form.max_channels} onChange={(e) => setForm({ ...form, max_channels: e.target.value })} />
                </div>
              </div>
              <Button type="submit">Create SIP Account</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">SIP Accounts</CardTitle>
          <CardDescription>{accounts.filter((a) => a.active).length} active, {accounts.length} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Codecs</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Active Calls</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!accounts.length ? (
                <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">No SIP accounts configured</TableCell></TableRow>
              ) : (
                accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.customers?.name ?? '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{a.username}</TableCell>
                    <TableCell className="font-mono text-sm">{a.host}:{a.port}</TableCell>
                    <TableCell><Badge variant="outline">{a.transport}</Badge></TableCell>
                    <TableCell className="text-xs">{a.codecs?.join(', ')}</TableCell>
                    <TableCell className="text-center">{a.max_channels}</TableCell>
                    <TableCell className="text-center font-mono">{a.active_calls}</TableCell>
                    <TableCell><Switch checked={a.active} onCheckedChange={(v) => toggleAccount(a.id, v)} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAccount(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
