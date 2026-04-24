import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

const EVENT_COLORS: Record<string, string> = {
  LOGIN:           'bg-green-500/10 text-green-500 border-green-500/20',
  LOGOUT:          'bg-slate-500/10 text-slate-500 border-slate-500/20',
  BALANCE_TOPUP:   'bg-blue-500/10 text-blue-500 border-blue-500/20',
  BALANCE_DEDUCT:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  ACCOUNT_UPDATED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ERROR:           'bg-red-500/10 text-red-500 border-red-500/20',
}

export default async function CustomerLogsPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('customer_logs')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customer Logs</h1>
        <p className="text-muted-foreground">Account activity and event history per customer</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Customer Events</CardTitle>
          <CardDescription>Last 200 entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40">Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-36">Event</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No customer log entries yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(log.customers as { name: string } | null)?.name ?? log.customer_id?.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={EVENT_COLORS[log.event_type] ?? 'bg-muted'}>
                        {log.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.message}</TableCell>
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
