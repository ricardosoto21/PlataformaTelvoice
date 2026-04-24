'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { RefreshCw, XCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-slate-500/10 text-slate-500 border-slate-500/20',
  RUNNING:   'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DONE:      'bg-green-500/10 text-green-500 border-green-500/20',
  FAILED:    'bg-red-500/10 text-red-500 border-red-500/20',
  CANCELLED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const supabase = createClient()

  async function load() {
    const query = supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(200)
    const { data } = await query
    setJobs(data ?? [])
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  async function cancelJob(id: string) {
    await supabase.from('jobs').update({ status: 'CANCELLED' }).eq('id', id).eq('status', 'PENDING')
    toast.success('Job cancelled')
    load()
  }

  const statuses = ['ALL', 'PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED']
  const filtered = filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Management</h1>
          <p className="text-muted-foreground">Monitor and manage all background jobs</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {statuses.filter((s) => s !== 'ALL').map((s) => (
          <Card key={s} className="border-border/50 cursor-pointer" onClick={() => setFilter(s)}>
            <CardContent className="flex items-center justify-between p-4">
              <Badge variant="outline" className={STATUS_COLORS[s]}>{s}</Badge>
              <span className="text-xl font-bold">{jobs.filter((j) => j.status === s).length}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Jobs</CardTitle>
              <CardDescription>{filtered.length} {filter === 'ALL' ? 'total' : filter.toLowerCase()} jobs</CardDescription>
            </div>
            <div className="flex gap-2">
              {statuses.map((s) => (
                <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)} className="h-7 text-xs">
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-48">Progress</TableHead>
                <TableHead className="w-24">Failed</TableHead>
                <TableHead className="w-36">Started</TableHead>
                <TableHead className="w-36">Duration</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No jobs found</TableCell>
                </TableRow>
              ) : (
                filtered.map((job) => {
                  const pct = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0
                  const duration = job.started_at && job.completed_at
                    ? formatDistanceToNow(new Date(job.started_at), { addSuffix: false })
                    : job.started_at ? `Running ${formatDistanceToNow(new Date(job.started_at))}` : '-'
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.name}</p>
                          {job.error && <p className="text-xs text-red-500 truncate max-w-xs">{job.error}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{job.type}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={STATUS_COLORS[job.status]}>{job.status}</Badge></TableCell>
                      <TableCell>
                        {job.total > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-red-500">
                        {job.failed > 0 ? job.failed.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {job.started_at ? format(new Date(job.started_at), 'MM/dd HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{duration}</TableCell>
                      <TableCell>
                        {job.status === 'PENDING' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => cancelJob(job.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
