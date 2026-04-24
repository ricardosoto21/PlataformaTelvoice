'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  Zap, ZapOff, RefreshCw, Play, Square,
  Server, Users, Wifi, WifiOff, AlertCircle,
  Activity, Clock, MessageSquare, TrendingUp,
  CheckCircle, XCircle, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface EngineStatus {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error'
  port: number
  startedAt: string | null
  activeSessions: number
  connectedVendors: number
  totalVendors: number
}

interface ClientSession {
  sessionId: string
  systemId: string
  customerId: string
  bindMode: string
  remoteAddress: string
  remotePort: number
  boundAt: string
  msgSent: number
  msgReceived: number
  lastActivity: string
}

interface VendorSession {
  vendorId: string
  vendorName: string
  host: string
  port: number
  systemId: string
  bindMode: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  connectedAt: string | null
  msgSent: number
  dlrReceived: number
  lastActivity: string | null
}

interface QueueStats {
  outbound: { waiting: number; active: number; failed: number; completed: number }
  dlr: { waiting: number; active: number; failed: number; completed: number }
}

interface StatusResponse {
  engine: EngineStatus
  clients: ClientSession[]
  vendors: VendorSession[]
  queues: QueueStats
}

const STATUS_CONFIG = {
  running:  { label: 'Running',  color: 'bg-green-500',  icon: Zap,     badge: 'default' },
  stopped:  { label: 'Stopped',  color: 'bg-slate-500',  icon: ZapOff,  badge: 'secondary' },
  starting: { label: 'Starting', color: 'bg-yellow-500', icon: Loader2, badge: 'outline' },
  stopping: { label: 'Stopping', color: 'bg-orange-500', icon: Loader2, badge: 'outline' },
  error:    { label: 'Error',    color: 'bg-red-500',    icon: AlertCircle, badge: 'destructive' },
} as const

const VENDOR_STATUS_CONFIG = {
  connected:    { label: 'Connected',    icon: Wifi,    className: 'text-green-500' },
  disconnected: { label: 'Disconnected', icon: WifiOff, className: 'text-slate-400' },
  connecting:   { label: 'Connecting',   icon: Loader2, className: 'text-yellow-500' },
  error:        { label: 'Error',        icon: AlertCircle, className: 'text-red-500' },
} as const

export default function SMPPEnginePage() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/smpp/status')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // engine may not be running yet
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleEngineAction = async (action: 'start' | 'stop') => {
    setActionLoading(action)
    try {
      const res = await fetch(`/api/smpp/${action}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(action === 'start' ? 'Engine started' : 'Engine stopped')
      await fetchStatus()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVendorAction = async (vendorId: string, action: 'connect' | 'disconnect') => {
    setActionLoading(`vendor-${vendorId}`)
    try {
      const res = await fetch(`/api/smpp/vendors/${vendorId}/${action}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`Vendor ${action}ed`)
      await fetchStatus()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const engine = data?.engine
  const statusConfig = engine ? STATUS_CONFIG[engine.status] : STATUS_CONFIG.stopped
  const StatusIcon = statusConfig.icon
  const isRunning = engine?.status === 'running'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMPP Engine</h1>
          <p className="text-sm text-muted-foreground">
            SMS Message Processing Engine — TCP port {engine?.port ?? 2775}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStatus}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleEngineAction('stop')}
              disabled={actionLoading === 'stop'}
            >
              {actionLoading === 'stop' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-1" />
              )}
              Stop Engine
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleEngineAction('start')}
              disabled={actionLoading === 'start'}
            >
              {actionLoading === 'start' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Start Engine
            </Button>
          )}
        </div>
      </div>

      {/* Status KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Engine status */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${statusConfig.color} bg-opacity-20`}>
              <StatusIcon className={`h-5 w-5 ${isRunning ? 'text-green-500' : 'text-muted-foreground'} ${engine?.status === 'starting' || engine?.status === 'stopping' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Engine Status</p>
              <p className="font-semibold">{statusConfig.label}</p>
              {engine?.startedAt && (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(engine.startedAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client Sessions</p>
              <p className="font-semibold text-xl">{engine?.activeSessions ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-500/10">
              <Server className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendors Connected</p>
              <p className="font-semibold text-xl">
                {engine?.connectedVendors ?? 0}
                <span className="text-sm text-muted-foreground font-normal"> / {engine?.totalVendors ?? 0}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-500/10">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Queue Outbound</p>
              <p className="font-semibold text-xl">{data?.queues.outbound.active ?? 0}</p>
              <p className="text-xs text-muted-foreground">{data?.queues.outbound.waiting ?? 0} waiting</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'SMS Outbound Queue', q: data?.queues.outbound },
          { label: 'DLR Queue', q: data?.queues.dlr },
        ].map(({ label, q }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-yellow-500">{q?.waiting ?? 0}</p>
                <p className="text-xs text-muted-foreground">Waiting</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{q?.active ?? 0}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{q?.completed ?? 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{q?.failed ?? 0}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendor connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendor Connections</CardTitle>
          <CardDescription>SMPP vendor connections status</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.vendors.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No vendors configured. Configure an SMPP account in the Vendors module.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>System ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Msgs Sent</TableHead>
                  <TableHead>DLR Received</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vendors.map((v) => {
                  const vcfg = VENDOR_STATUS_CONFIG[v.status]
                  const VIcon = vcfg.icon
                  return (
                    <TableRow key={v.vendorId}>
                      <TableCell className="font-medium">{v.vendorName}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{v.host}:{v.port}</TableCell>
                      <TableCell className="font-mono text-xs">{v.systemId}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${vcfg.className}`}>
                          <VIcon className={`h-3.5 w-3.5 ${v.status === 'connecting' ? 'animate-spin' : ''}`} />
                          <span className="text-xs">{vcfg.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>{v.msgSent.toLocaleString()}</TableCell>
                      <TableCell>{v.dlrReceived.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {v.connectedAt ? formatDistanceToNow(new Date(v.connectedAt), { addSuffix: true }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.status === 'connected' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVendorAction(v.vendorId, 'disconnect')}
                            disabled={actionLoading === `vendor-${v.vendorId}`}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVendorAction(v.vendorId, 'connect')}
                            disabled={actionLoading === `vendor-${v.vendorId}` || !isRunning}
                          >
                            {actionLoading === `vendor-${v.vendorId}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : 'Connect'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Client sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Client Sessions</CardTitle>
          <CardDescription>Currently connected SMPP clients</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.clients.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No active sessions. Clients must bind to port {engine?.port ?? 2775}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System ID</TableHead>
                  <TableHead>Bind Mode</TableHead>
                  <TableHead>Remote IP</TableHead>
                  <TableHead>Msgs Sent</TableHead>
                  <TableHead>Msgs Received</TableHead>
                  <TableHead>Bound</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clients.map((s) => (
                  <TableRow key={s.sessionId}>
                    <TableCell className="font-mono font-medium">{s.systemId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{s.bindMode}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.remoteAddress}:{s.remotePort}
                    </TableCell>
                    <TableCell>{s.msgSent.toLocaleString()}</TableCell>
                    <TableCell>{s.msgReceived.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.boundAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.lastActivity), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Setup instructions */}
      {!isRunning && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-sm">Required configuration</p>
                <p className="text-sm text-muted-foreground">
                  To use the SMPP engine in production, make sure to configure the following environment variables:
                </p>
                <ul className="text-xs font-mono text-muted-foreground space-y-1 mt-2">
                  <li><span className="text-foreground">SMPP_PORT</span>=2775 (TCP port of the server)</li>
                  <li><span className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</span>=eyJ... (Supabase admin key)</li>
                  <li><span className="text-foreground">REDIS_URL</span>=redis://... (Upstash or Redis)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  The engine requires a dedicated server (VPS/Docker) as it uses a persistent TCP socket
                  that is not compatible with serverless environments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
