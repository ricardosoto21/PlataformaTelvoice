import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Phone, PhoneCall, PhoneOff, Clock } from 'lucide-react'

export default async function VoiceStatsPage() {
  const supabase = await createClient()

  const { data: cdrs } = await supabase
    .from('voice_cdrs')
    .select('*, customers(name), sip_accounts(username)')
    .order('created_at', { ascending: false })
    .limit(200)

  const totalCalls = cdrs?.length ?? 0
  const answeredCalls = cdrs?.filter(c => c.status === 'ANSWERED').length ?? 0
  const failedCalls = cdrs?.filter(c => c.status === 'FAILED').length ?? 0
  const totalDuration = cdrs?.reduce((sum, c) => sum + (c.duration_seconds ?? 0), 0) ?? 0
  const totalMinutes = Math.round(totalDuration / 60)

  const statCards = [
    { label: 'Total Calls', value: totalCalls.toLocaleString(), icon: Phone, color: 'text-primary' },
    { label: 'Answered', value: answeredCalls.toLocaleString(), icon: PhoneCall, color: 'text-green-500' },
    { label: 'Failed / No Answer', value: failedCalls.toLocaleString(), icon: PhoneOff, color: 'text-destructive' },
    { label: 'Total Minutes', value: totalMinutes.toLocaleString(), icon: Clock, color: 'text-primary' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ANSWERED':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Answered</Badge>
      case 'BUSY':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Busy</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'NO_ANSWER':
        return <Badge variant="secondary">No Answer</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Voice Statistics</h1>
        <p className="text-muted-foreground">Call traffic analysis and performance metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`h-8 w-8 ${card.color}`} />
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>Last 200 call detail records</CardDescription>
        </CardHeader>
        <CardContent>
          {!cdrs || cdrs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No call records</h3>
              <p className="mt-2 text-sm text-muted-foreground">Voice CDRs will appear here once calls are processed.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>SIP Account</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cdrs.map((cdr) => (
                  <TableRow key={cdr.id}>
                    <TableCell className="font-mono text-xs">{cdr.caller_number}</TableCell>
                    <TableCell className="font-mono text-xs">{cdr.callee_number}</TableCell>
                    <TableCell className="font-mono text-xs">{(cdr.sip_accounts as { username: string } | null)?.username || '-'}</TableCell>
                    <TableCell>
                      {cdr.duration_seconds != null
                        ? `${Math.floor(cdr.duration_seconds / 60)}m ${cdr.duration_seconds % 60}s`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {cdr.cost != null ? `$${Number(cdr.cost).toFixed(4)}` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(cdr.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {cdr.created_at ? new Date(cdr.created_at).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
