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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-slate-500/10 text-slate-500 border-slate-500/20',
  PENDING:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const CATEGORIES = ['TRANSACTIONAL', 'PROMOTIONAL', 'OTP', 'ALERT', 'REMINDER', 'OTHER']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<any | null>(null)
  const [form, setForm] = useState({ customer_id: '', name: '', content: '', category: 'TRANSACTIONAL', status: 'PENDING' as string })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('sms_templates').select('*, customers(name)').order('created_at', { ascending: false })
    setTemplates(data ?? [])
    const { data: c } = await supabase.from('customers').select('id, name').eq('active', true)
    setCustomers(c ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('sms_templates').insert({
      customer_id: form.customer_id || null,
      name: form.name,
      content: form.content,
      category: form.category,
      status: form.status,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Template created')
    setOpen(false)
    setForm({ customer_id: '', name: '', content: '', category: 'TRANSACTIONAL', status: 'PENDING' })
    load()
  }

  async function approveTemplate(id: string, status: 'APPROVED' | 'REJECTED') {
    await supabase.from('sms_templates').update({ status, approved_at: status === 'APPROVED' ? new Date().toISOString() : null }).eq('id', id)
    toast.success(`Template ${status.toLowerCase()}`)
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SMS Templates</h1>
          <p className="text-muted-foreground">Manage and approve message templates per customer</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create SMS Template</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Template Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="OTP Verification" />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Content * <span className="text-muted-foreground text-xs">(use {`{{variable}}`} for placeholders)</span></Label>
                <Textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Your OTP code is {{code}}. Valid for {{minutes}} minutes." />
                <p className="text-xs text-muted-foreground">{form.content.length} / 160 chars</p>
              </div>
              <div className="grid gap-2">
                <Label>Initial Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Create Template</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Templates</CardTitle>
          <CardDescription>{templates.filter((t) => t.status === 'PENDING').length} pending approval</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!templates.length ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No templates yet</TableCell></TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.customers?.name ?? <span className="text-muted-foreground">Global</span>}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_COLORS[t.status]}>{t.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{format(new Date(t.created_at), 'MM/dd/yy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(t)}><Eye className="h-3.5 w-3.5" /></Button>
                        {t.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500" onClick={() => approveTemplate(t.id, 'APPROVED')}><CheckCircle className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => approveTemplate(t.id, 'REJECTED')}><XCircle className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge variant="outline">{preview.category}</Badge>
                <Badge variant="outline" className={STATUS_COLORS[preview.status]}>{preview.status}</Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm whitespace-pre-wrap">{preview.content}</div>
              <p className="text-xs text-muted-foreground">{preview.content?.length} characters</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
