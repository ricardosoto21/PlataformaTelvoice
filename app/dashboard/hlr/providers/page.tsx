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

export default function HlrProvidersPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', host: '', port: '2775', username: '', password: '', protocol: 'HTTP', cost_per_lookup: '0', currency: 'USD' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('hlr_providers').select('*').order('created_at', { ascending: false })
    setProviders(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('hlr_providers').insert({
      name: form.name, host: form.host, port: parseInt(form.port),
      username: form.username || null, password: form.password || null,
      protocol: form.protocol, cost_per_lookup: parseFloat(form.cost_per_lookup), currency: form.currency,
    })
    if (error) { toast.error(error.message); return }
    toast.success('HLR provider created')
    setOpen(false)
    setForm({ name: '', host: '', port: '2775', username: '', password: '', protocol: 'HTTP', cost_per_lookup: '0', currency: 'USD' })
    load()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('hlr_providers').update({ active }).eq('id', id)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('hlr_providers').delete().eq('id', id)
    toast.success('Provider deleted')
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HLR Providers</h1>
          <p className="text-muted-foreground">Configure Home Location Register lookup providers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Provider</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add HLR Provider</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Provider Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HLR Lookup Pro" />
              </div>
              <div className="grid gap-2">
                <Label>Protocol</Label>
                <Select value={form.protocol} onValueChange={(v) => setForm({ ...form, protocol: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HTTP">HTTP</SelectItem>
                    <SelectItem value="SMPP">SMPP</SelectItem>
                    <SelectItem value="SS7">SS7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 grid gap-2">
                  <Label>Host / URL *</Label>
                  <Input required value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="api.hlrprovider.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Port</Label>
                  <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cost per Lookup</Label>
                  <Input type="number" step="0.000001" value={form.cost_per_lookup} onChange={(e) => setForm({ ...form, cost_per_lookup: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['USD','EUR','GBP'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit">Add Provider</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">HLR Providers</CardTitle>
          <CardDescription>{providers.filter((p) => p.active).length} active providers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!providers.length ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No HLR providers configured</TableCell></TableRow>
              ) : (
                providers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.protocol}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{p.host}:{p.port}</TableCell>
                    <TableCell className="font-mono text-xs">${Number(p.cost_per_lookup).toFixed(6)} {p.currency}</TableCell>
                    <TableCell>
                      <Switch checked={p.active} onCheckedChange={(v) => toggleActive(p.id, v)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
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
