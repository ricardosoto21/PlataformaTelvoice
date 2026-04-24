'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FlaskConical, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

type SimResult = {
  matched: boolean
  vendor?: string
  vendorAccount?: string
  priority?: number
  cost?: number
  route?: string
  mcc?: string
  mnc?: string
  country?: string
  operator?: string
  reason?: string
}

export default function LCRSimulationPage() {
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)

  const runSimulation = async () => {
    if (!destination) return
    setLoading(true)
    try {
      const res = await fetch(`/api/lcr/simulate?number=${encodeURIComponent(destination)}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ matched: false, reason: 'Failed to contact simulation API' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">LCR Simulation</h1>
        <p className="text-muted-foreground">
          Enter a destination number to simulate the routing decision
        </p>
      </div>

      <Card className="border-border/50 max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle>Route Simulator</CardTitle>
          </div>
          <CardDescription>
            Simulates LCR engine logic: MCC/MNC lookup, vendor selection, cost calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Destination Number</Label>
            <div className="flex gap-2">
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="+56912345678"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
              />
              <Button onClick={runSimulation} disabled={loading || !destination}>
                {loading ? 'Simulating...' : 'Simulate'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter number in E.164 format (e.g. +1415xxxxxxx)</p>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-border/50 max-w-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.matched
                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                : <AlertCircle className="h-5 w-5 text-destructive" />
              }
              <CardTitle>Simulation Result</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {result.matched ? (
              <>
                {/* Destination info */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Destination</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'MCC', value: result.mcc },
                      { label: 'MNC', value: result.mnc },
                      { label: 'Country', value: result.country },
                      { label: 'Operator', value: result.operator },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-mono font-medium">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Route selected */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Selected Route</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Customer</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{result.route || 'Default'}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-primary">{result.vendor}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Vendor Account</span>
                      <span className="text-sm font-medium">{result.vendorAccount || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Priority</span>
                      <Badge variant="outline" className="w-fit">{result.priority}</Badge>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Vendor Cost</span>
                      <span className="text-sm font-medium text-primary">
                        {result.cost != null ? `$${Number(result.cost).toFixed(5)}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">No route found</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{result.reason || 'No LCR rule matches this destination.'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
