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

export default function HlrRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ provider_id: '', mcc: '', mnc: '', country: '', priority: '1' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('hlr_dip_rules').select('*, hlr_providers(name)').order('priority').order('mcc')
    setRules(data ?? [])
    const { data: p } = await supabase.from('hlr_providers').select('id, name').eq('active', true)
    setProviders(p ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('hlr_dip_rules').insert({
      provider_id: form.provider_id,
      mcc: form.mcc,
      mnc: form.mnc || null,
      country: form.country || null,
      priority: parseInt(form.priority),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Dip rule created')
    setOpen(false)
    setForm({ provider_id: '', mcc: '', mnc: '', country: '', priority: '1' })
    load()
  }

  async function toggleRule(id: string, active: boolean) {
    await supabase.from('hlr_dip_rules').update({ active }).eq('id', id)
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HLR Dip Rules</h1>
          <p className="text-muted-foreground">Define which provider to use for each MCC/MNC range</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add HLR Dip Rule</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Provider *</Label>
                <Select value={form.provider_id} onValueChange={(v) => setForm({ ...form, provider_id: v })} required>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>MCC *</Label>
                  <Input required maxLength={3} placeholder="334" value={form.mcc} onChange={(e) => setForm({ ...form, mcc: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>MNC (blank = all)</Label>
                  <Input maxLength={3} placeholder="020" value={form.mnc} onChange={(e) => setForm({ ...form, mnc: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Country</Label>
                  <Input placeholder="Mexico" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Input type="number" min={1} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
                </div>
              </div>
              <Button type="submit">Create Rule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Dip Rules</CardTitle>
          <CardDescription>{rules.filter((r) => r.active).length} active rules</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Priority</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="w-20">MCC</TableHead>
                <TableHead className="w-20">MNC</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="w-20">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rules.length ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No dip rules configured</TableCell></TableRow>
              ) : (
                rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-center">{r.priority}</TableCell>
                    <TableCell className="font-medium">{r.hlr_providers?.name}</TableCell>
                    <TableCell className="font-mono text-sm">{r.mcc}</TableCell>
                    <TableCell className="font-mono text-sm">{r.mnc ?? <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell>{r.country ?? '-'}</TableCell>
                    <TableCell><Switch checked={r.active} onCheckedChange={(v) => toggleRule(r.id, v)} /></TableCell>
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
