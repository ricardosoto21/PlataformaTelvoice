import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollText, AlertTriangle, Info, Bug, XCircle, AlertOctagon } from 'lucide-react'
import { format } from 'date-fns'

const LEVEL_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  DEBUG: { color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: <Bug className="h-3 w-3" /> },
  INFO:  { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',   icon: <Info className="h-3 w-3" /> },
  WARN:  { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: <AlertTriangle className="h-3 w-3" /> },
  ERROR: { color: 'bg-red-500/10 text-red-500 border-red-500/20',       icon: <XCircle className="h-3 w-3" /> },
  FATAL: { color: 'bg-rose-700/10 text-rose-700 border-rose-700/20',    icon: <AlertOctagon className="h-3 w-3" /> },
}

export default async function SystemLogsPage() {
  const supabase = await createClient()
  const { data: logs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground">Platform-level events and errors</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => {
          const count = logs?.filter((l) => l.level === level).length ?? 0
          return (
            <Card key={level} className="border-border/50">
              <CardContent className="flex items-center gap-3 p-4">
                <Badge variant="outline" className={`gap-1 ${cfg.color}`}>
                  {cfg.icon}
                  {level}
                </Badge>
                <span className="text-xl font-bold">{count}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Log Entries</CardTitle>
          <CardDescription>Last 200 entries, newest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40">Time</TableHead>
                <TableHead className="w-24">Level</TableHead>
                <TableHead className="w-32">Module</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No log entries yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.INFO
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${cfg.color}`}>
                          {cfg.icon}
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.module ?? '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.message}</TableCell>
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
