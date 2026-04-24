'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, AlertTriangle, FileText } from 'lucide-react'
import type { BSSStats } from '@/lib/dashboard-actions'

interface BSSStatsProps {
  data: BSSStats
}

export function BSSStatsCard({ data }: BSSStatsProps) {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BSS Overview</CardTitle>
        <CardDescription>Billing and revenue summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Revenue</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">
              {formatCurrency(data.totalRevenue)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Cost</span>
            </div>
            <p className="text-xl font-bold text-red-500">
              {formatCurrency(data.totalCost)}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Net Profit</span>
            <span className="text-sm font-semibold text-emerald-500">
              {formatCurrency(data.profit)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Margin</span>
            <span className="text-sm font-semibold">
              {data.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <FileText className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.pendingInvoices}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-semibold">{formatCurrency(data.overdueBalance)}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
