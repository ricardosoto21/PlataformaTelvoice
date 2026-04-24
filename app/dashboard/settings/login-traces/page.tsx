import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { History, CheckCircle2, XCircle } from 'lucide-react'

export default async function LoginTracesPage() {
  const supabase = await createClient()

  const { data: traces } = await supabase
    .from('login_traces')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const successCount = traces?.filter(t => t.result === 'SUCCESS').length ?? 0
  const failedCount = traces?.filter(t => t.result === 'FAILED').length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Login Traces</h1>
        <p className="text-muted-foreground">User access history and authentication events</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{traces?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-500">{successCount}</p>
              <p className="text-xs text-muted-foreground">Successful Logins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-destructive">{failedCount}</p>
              <p className="text-xs text-muted-foreground">Failed Attempts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Access Log</CardTitle>
          <CardDescription>Last 100 login events across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {!traces || traces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No login traces yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Login events will appear here automatically.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date / Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traces.map((trace) => (
                  <TableRow key={trace.id}>
                    <TableCell className="font-medium">{trace.username}</TableCell>
                    <TableCell className="font-mono text-xs">{trace.ip_address}</TableCell>
                    <TableCell>{trace.country || '-'}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                      {trace.device || '-'}
                    </TableCell>
                    <TableCell>
                      {trace.result === 'SUCCESS' ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(trace.created_at).toLocaleString()}
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
