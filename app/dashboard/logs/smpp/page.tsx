import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { format } from 'date-fns'

export default async function SmppLogsPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('smpp_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMPP Logs</h1>
        <p className="text-muted-foreground">Raw PDU-level traffic log for all sessions</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">PDU Traffic</CardTitle>
          <CardDescription>Last 500 PDUs</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40">Time</TableHead>
                <TableHead className="w-10">Dir</TableHead>
                <TableHead>System ID</TableHead>
                <TableHead>PDU Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Dest</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No SMPP traffic yet — start the engine to see PDU logs
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MM/dd HH:mm:ss.SSS')}
                    </TableCell>
                    <TableCell>
                      {log.direction === 'IN' ? (
                        <ArrowDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-blue-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">{log.system_id ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.pdu_type ?? '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.source_addr ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.dest_addr ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.status ?? '-'}</TableCell>
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
