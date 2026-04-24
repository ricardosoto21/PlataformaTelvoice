import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  ANSWERED:  'bg-green-500/10 text-green-500 border-green-500/20',
  NO_ANSWER: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  BUSY:      'bg-amber-500/10 text-amber-500 border-amber-500/20',
  FAILED:    'bg-red-500/10 text-red-500 border-red-500/20',
  CANCELLED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

function formatDuration(secs: number | null) {
  if (!secs) return '-'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', `${s}s`].filter(Boolean).join(' ')
}

export default async function VoiceCdrPage() {
  const supabase = await createClient()
  const { data: cdrs } = await supabase
    .from('voice_cdrs')
    .select('*, customers(name), sip_accounts(username)')
    .order('created_at', { ascending: false })
    .limit(200)

  const totalRevenue = cdrs?.reduce((sum, c) => sum + Number(c.cost ?? 0), 0) ?? 0
  const answered = cdrs?.filter((c) => c.status === 'ANSWERED') ?? []
  const asr = cdrs?.length ? Math.round((answered.length / cdrs.length) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Voice CDR</h1>
        <p className="text-muted-foreground">Call Detail Records for all voice traffic</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Calls</p><p className="text-2xl font-bold">{cdrs?.length.toLocaleString() ?? 0}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Answered</p><p className="text-2xl font-bold">{answered.length.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">ASR</p><p className="text-2xl font-bold">{asr}%</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-2xl font-bold">${totalRevenue.toFixed(4)}</p></CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Call Detail Records</CardTitle>
          <CardDescription>Last 200 calls</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>SIP Account</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cdrs?.length ? (
                <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">No CDR records yet</TableCell></TableRow>
              ) : (
                cdrs.map((cdr) => (
                  <TableRow key={cdr.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(cdr.created_at), 'MM/dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">{cdr.customers?.name ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{cdr.sip_accounts?.username ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{cdr.caller_number}</TableCell>
                    <TableCell className="font-mono text-xs">{cdr.callee_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[cdr.status] ?? ''}>{cdr.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatDuration(cdr.duration_seconds)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatDuration(cdr.billable_seconds)}</TableCell>
                    <TableCell className="font-mono text-xs">${Number(cdr.cost).toFixed(4)}</TableCell>
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
