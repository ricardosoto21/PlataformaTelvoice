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
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  RUNNING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DONE:    'bg-green-500/10 text-green-500 border-green-500/20',
  FAILED:  'bg-red-500/10 text-red-500 border-red-500/20',
}

export default function ReRatePage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [ratePlans, setRatePlans] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', customer_id: '', period_start: '', period_end: '', new_rate_plan_id: '' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('re_rate_jobs').select('*, customers(name), rate_plans(name)').order('created_at', { ascending: false })
    setJobs(data ?? [])
    const { data: c } = await supabase.from('customers').select('id, name').eq('active', true)
    const { data: r } = await supabase.from('rate_plans').select('id, name').eq('active', true)
    setCustomers(c ?? [])
    setRatePlans(r ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('re_rate_jobs').insert({
      name: form.name,
      customer_id: form.customer_id || null,
      period_start: form.period_start,
      period_end: form.period_end,
      new_rate_plan_id: form.new_rate_plan_id || null,
      status: 'PENDING',
    })
    if (error) { toast.error(error.message); return }
    toast.success('Re-rate job created')
    setOpen(false)
    setForm({ name: '', customer_id: '', period_start: '', period_end: '', new_rate_plan_id: '' })
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Re-Rate Jobs</h1>
          <p className="text-muted-foreground">Reprocess historical messages with a different rate plan</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Re-Rate Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Re-Rate Job</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Job Name *</Label>
                <Input placeholder="March re-rate Telcel" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Customer (blank = all)</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All customers" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Period Start *</Label>
                  <Input type="datetime-local" required value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Period End *</Label>
                  <Input type="datetime-local" required value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>New Rate Plan</Label>
                <Select value={form.new_rate_plan_id} onValueChange={(v) => setForm({ ...form, new_rate_plan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select rate plan" /></SelectTrigger>
                  <SelectContent>
                    {ratePlans.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Create Job</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Re-Rate Jobs</CardTitle>
          <CardDescription>{jobs.length} total jobs</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Rate Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!jobs.length ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No re-rate jobs yet</TableCell></TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.customers?.name ?? <span className="text-muted-foreground">All</span>}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(job.period_start), 'MM/dd/yy')} — {format(new Date(job.period_end), 'MM/dd/yy')}
                    </TableCell>
                    <TableCell>{job.rate_plans?.name ?? '-'}</TableCell>
                    <TableCell><Badge variant="outline" className={STATUS_COLORS[job.status]}>{job.status}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{job.affected_messages.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{format(new Date(job.created_at), 'MM/dd HH:mm')}</TableCell>
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
