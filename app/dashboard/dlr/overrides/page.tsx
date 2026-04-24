'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const DLR_STATUSES = ['DELIVERED', 'UNDELIVERED', 'ACCEPTED', 'REJECTED', 'UNKNOWN', 'ENROUTE', 'EXPIRED', 'DELETED', 'UNACCEPTABLE', 'FAILED']

export default function DlrOverridesPage() {
  const [overrides, setOverrides] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    customer_id: '', vendor_id: '', mcc: '', mnc: '',
    original_status: '', override_status: '',
  })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('dlr_overrides')
      .select('*, customers(name), vendors(name)')
      .order('created_at', { ascending: false })
    setOverrides(data ?? [])
    const { data: c } = await supabase.from('customers').select('id, name').eq('active', true)
    const { data: v } = await supabase.from('vendors').select('id, name').eq('active', true)
    setCustomers(c ?? [])
    setVendors(v ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('dlr_overrides').insert({
      ...form,
      customer_id: form.customer_id || null,
      vendor_id: form.vendor_id || null,
      mcc: form.mcc || null,
      mnc: form.mnc || null,
      original_status: form.original_status || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Override rule created')
    setOpen(false)
    setForm({ customer_id: '', vendor_id: '', mcc: '', mnc: '', original_status: '', override_status: '' })
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('dlr_overrides').delete().eq('id', id)
    toast.success('Rule deleted')
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">DLR Overrides</h1>
          <p className="text-muted-foreground">Rewrite DLR status codes per customer / vendor / MCC</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Override</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create DLR Override Rule</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Customer (optional)</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Any customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Vendor (optional)</Label>
                <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Any vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>MCC (optional)</Label>
                  <Input placeholder="334" value={form.mcc} onChange={(e) => setForm({ ...form, mcc: e.target.value })} maxLength={3} />
                </div>
                <div className="grid gap-2">
                  <Label>MNC (optional)</Label>
                  <Input placeholder="020" value={form.mnc} onChange={(e) => setForm({ ...form, mnc: e.target.value })} maxLength={3} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Original Status (blank = any)</Label>
                <Select value={form.original_status} onValueChange={(v) => setForm({ ...form, original_status: v })}>
                  <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                  <SelectContent>
                    {DLR_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Override To *</Label>
                <Select value={form.override_status} onValueChange={(v) => setForm({ ...form, override_status: v })} required>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {DLR_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Create Rule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Active Override Rules</CardTitle>
          <CardDescription>Rules are matched in order: customer → vendor → MCC/MNC → status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>MCC</TableHead>
                <TableHead>MNC</TableHead>
                <TableHead>Original Status</TableHead>
                <TableHead>Override To</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!overrides.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No override rules</TableCell>
                </TableRow>
              ) : (
                overrides.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.customers?.name ?? <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell>{o.vendors?.name ?? <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell className="font-mono text-xs">{o.mcc ?? <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell className="font-mono text-xs">{o.mnc ?? <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell>{o.original_status ? <Badge variant="outline">{o.original_status}</Badge> : <span className="text-muted-foreground">Any</span>}</TableCell>
                    <TableCell><Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20" variant="outline">{o.override_status}</Badge></TableCell>
                    <TableCell><Badge variant={o.active ? 'default' : 'secondary'}>{o.active ? 'Active' : 'Off'}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(o.id)}>
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
