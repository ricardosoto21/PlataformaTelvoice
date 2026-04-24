import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

const EVENT_COLORS: Record<string, string> = {
  CONNECT:    'bg-green-500/10 text-green-500 border-green-500/20',
  DISCONNECT: 'bg-red-500/10 text-red-500 border-red-500/20',
  ERROR:      'bg-red-500/10 text-red-500 border-red-500/20',
  BIND:       'bg-blue-500/10 text-blue-500 border-blue-500/20',
  UNBIND:     'bg-slate-500/10 text-slate-500 border-slate-500/20',
  THROTTLE:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
}

export default async function VendorLogsPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('vendor_logs')
    .select('*, vendors(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendor Logs</h1>
        <p className="text-muted-foreground">Connection and event history per vendor</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Vendor Events</CardTitle>
          <CardDescription>Last 200 entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40">Time</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="w-32">Event</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No vendor log entries yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(log.vendors as { name: string } | null)?.name ?? log.vendor_id?.slice(0, 8)}
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
