import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-500/10 text-amber-500 border-amber-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DONE:       'bg-green-500/10 text-green-500 border-green-500/20',
  FAILED:     'bg-red-500/10 text-red-500 border-red-500/20',
}

export default async function DlrQueuePage() {
  const supabase = await createClient()
  const { data: queue } = await supabase
    .from('dlr_queue')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const counts = {
    PENDING: queue?.filter((q) => q.status === 'PENDING').length ?? 0,
    PROCESSING: queue?.filter((q) => q.status === 'PROCESSING').length ?? 0,
    DONE: queue?.filter((q) => q.status === 'DONE').length ?? 0,
    FAILED: queue?.filter((q) => q.status === 'FAILED').length ?? 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DLR Queue</h1>
        <p className="text-muted-foreground">Delivery receipt delivery queue status</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} className="border-border/50">
            <CardContent className="flex items-center justify-between p-4">
              <Badge variant="outline" className={STATUS_COLORS[status]}>{status}</Badge>
              <span className="text-2xl font-bold">{count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Queue Items</CardTitle>
          <CardDescription>Last 200 entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40">Created</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">DLR Status</TableHead>
                <TableHead className="w-16">Attempts</TableHead>
                <TableHead>Next Attempt</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!queue?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    DLR queue is empty
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'MM/dd HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(item.customers as { name: string } | null)?.name ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[item.status]}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.dlr_status ?? '-'}</TableCell>
                    <TableCell className="text-center">{item.attempts}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.next_attempt_at ? format(new Date(item.next_attempt_at), 'MM/dd HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs text-red-500">
                      {item.error ?? '-'}
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
