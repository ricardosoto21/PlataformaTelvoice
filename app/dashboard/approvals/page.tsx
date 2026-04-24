'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
}

const TYPE_COLORS: Record<string, string> = {
  SENDER_ID:             'bg-blue-500/10 text-blue-500 border-blue-500/20',
  TEMPLATE:              'bg-purple-500/10 text-purple-500 border-purple-500/20',
  CUSTOMER_REGISTRATION: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('approval_requests')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleAction(status: 'APPROVED' | 'REJECTED') {
    if (!selected) return
    setLoading(true)
    const { error } = await supabase.from('approval_requests').update({
      status,
      review_note: note,
      reviewed_at: new Date().toISOString(),
    }).eq('id', selected.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Request ${status.toLowerCase()}`)
    setSelected(null)
    setNote('')
    load()
  }

  const pending = requests.filter((r) => r.status === 'PENDING')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve sender IDs, templates, and customer registrations</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <Card key={s} className="border-border/50">
            <CardContent className="flex items-center justify-between p-4">
              <Badge variant="outline" className={STATUS_COLORS[s]}>{s}</Badge>
              <span className="text-2xl font-bold">{requests.filter((r) => r.status === s).length}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Requests</CardTitle>
          <CardDescription>{pending.length} pending review</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead className="w-40">Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36">Created</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!requests.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No approval requests</TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.customers?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={TYPE_COLORS[req.type] ?? ''}>{req.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{req.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[req.status]}>{req.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(req.created_at), 'MM/dd/yy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {req.status === 'PENDING' && (
                        <Button variant="outline" size="sm" onClick={() => { setSelected(req); setNote('') }}>
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selected.customers?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline" className={TYPE_COLORS[selected.type]}>{selected.type.replace('_', ' ')}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{selected.subject}</span>
                </div>
                {selected.content && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Content</span>
                    <p className="rounded bg-muted p-2 font-mono text-xs">{selected.content}</p>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Review Note (optional)</label>
                <Textarea placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading} onClick={() => handleAction('APPROVED')}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button className="flex-1" variant="destructive" disabled={loading} onClick={() => handleAction('REJECTED')}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
