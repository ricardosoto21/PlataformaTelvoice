'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Wifi, WifiOff, Users, Server, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

export default function SMPPSessionsPage() {
  const [clients, setClients] = useState<ClientSession[]>([])
  const [vendors, setVendors] = useState<VendorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/smpp/sessions')
      if (res.ok) {
        const json = await res.json()
        setClients(json.clients ?? [])
        setVendors(json.vendors ?? [])
        setLastUpdated(new Date())
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 3000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const VENDOR_STATUS: Record<VendorSession['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    connected:    { label: 'Connected',    variant: 'default' },
    disconnected: { label: 'Disconnected', variant: 'secondary' },
    connecting:   { label: 'Connecting',   variant: 'outline' },
    error:        { label: 'Error',        variant: 'destructive' },
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Sesiones SMPP activas — actualiza cada 3 segundos
            {lastUpdated && (
              <span className="ml-2 text-xs">
                (ultimo update: {formatDistanceToNow(lastUpdated, { addSuffix: true })})
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Client Sessions</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center">
              <Server className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendor Sessions</p>
              <p className="text-2xl font-bold">
                {vendors.filter(v => v.status === 'connected').length}
                <span className="text-sm font-normal text-muted-foreground"> / {vendors.length}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client sessions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Sessions (Inbound)
          </CardTitle>
          <CardDescription>Clientes que han hecho bind al servidor SMPP</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay sesiones de clientes activas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System ID</TableHead>
                  <TableHead>Bind Mode</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>TX</TableHead>
                  <TableHead>RX</TableHead>
                  <TableHead>Bound Since</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((s) => (
                  <TableRow key={s.sessionId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono font-medium">{s.systemId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">{s.bindMode}</Badge>
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

      {/* Vendor sessions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Vendor Sessions (Outbound)
          </CardTitle>
          <CardDescription>Conexiones salientes a vendors SMPP</CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay vendors registrados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>System ID</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TX</TableHead>
                  <TableHead>DLR RX</TableHead>
                  <TableHead>Connected Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => {
                  const vcfg = VENDOR_STATUS[v.status]
                  return (
                    <TableRow key={v.vendorId}>
                      <TableCell className="font-medium">{v.vendorName}</TableCell>
                      <TableCell className="font-mono text-xs">{v.systemId}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {v.host}:{v.port}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vcfg.variant} className="text-xs">
                          {v.status === 'connecting' && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          {vcfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{v.msgSent.toLocaleString()}</TableCell>
                      <TableCell>{v.dlrReceived.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {v.connectedAt
                          ? formatDistanceToNow(new Date(v.connectedAt), { addSuffix: true })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
