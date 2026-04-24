import { Suspense } from 'react'
import { Server, MessageSquare, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportFilters } from '@/components/reports/report-filters'
import { getVendorReport, getVendorsForFilter } from '@/lib/report-actions'

interface PageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    vendorId?: string
  }>
}

async function VendorReportContent({ searchParams }: { searchParams: Awaited<PageProps['searchParams']> }) {
  const filters = {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    vendorId: searchParams.vendorId,
  }
  
  const [{ messages, byVendor }, vendors] = await Promise.all([
    getVendorReport(filters),
    getVendorsForFilter(),
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(value)
  }

  const totalMessages = messages.length
  const totalCost = byVendor.reduce((sum, v) => sum + v.cost, 0)
  const totalDelivered = byVendor.reduce((sum, v) => sum + v.delivered, 0)
  const totalFailed = byVendor.reduce((sum, v) => sum + v.failed, 0)
  const avgDeliveryRate = totalMessages > 0 ? (totalDelivered / totalMessages) * 100 : 0

  return (
    <div className="space-y-6">
      <ReportFilters
        vendors={vendors}
        showVendorFilter
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vendors</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byVendor.length}</div>
            <p className="text-xs text-muted-foreground">With traffic in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="h-3 w-3" /> {totalDelivered.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" /> {totalFailed.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">Vendor termination</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg DLR Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryRate.toFixed(1)}%</div>
            <Progress value={avgDeliveryRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Vendor Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
          <CardDescription>
            Traffic, cost, and delivery rates by vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byVendor.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No vendor traffic found for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">DLR Rate</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Traffic Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byVendor.map((item, index) => {
                  const dlrRate = item.count > 0 ? (item.delivered / item.count) * 100 : 0
                  const trafficShare = totalMessages > 0 ? (item.count / totalMessages) * 100 : 0
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.vendor?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.vendor?.connection_status === 'CONNECTED' ? 'default' : 'secondary'}
                        >
                          {item.vendor?.connection_status || 'UNKNOWN'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-500">
                        {item.delivered.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {item.failed.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={dlrRate >= 90 ? 'text-green-500' : dlrRate >= 70 ? 'text-yellow-500' : 'text-red-500'}>
                          {dlrRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-500">
                        {formatCurrency(item.cost)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={trafficShare} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">{trafficShare.toFixed(1)}%</span>
                        </div>
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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[72px] w-full" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}

export default async function VendorReportPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Report</h1>
        <p className="text-muted-foreground">
          Traffic, cost, and performance analysis by vendor
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <VendorReportContent searchParams={params} />
      </Suspense>
    </div>
  )
}
