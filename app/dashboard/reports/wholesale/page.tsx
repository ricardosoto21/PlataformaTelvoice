import { Suspense } from 'react'
import { Globe, MessageSquare, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportFilters } from '@/components/reports/report-filters'
import { getWholesaleReport, getCustomersForFilter } from '@/lib/report-actions'

interface PageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    customerId?: string
    mcc?: string
  }>
}

async function WholesaleReportContent({ searchParams }: { searchParams: Awaited<PageProps['searchParams']> }) {
  const filters = {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    customerId: searchParams.customerId,
    mcc: searchParams.mcc,
  }
  
  const [{ messages, byDestination }, customers] = await Promise.all([
    getWholesaleReport(filters),
    getCustomersForFilter(),
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(value)
  }

  const totalMessages = messages.length
  const totalRevenue = byDestination.reduce((sum, d) => sum + d.revenue, 0)
  const totalCost = byDestination.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const uniqueDestinations = byDestination.length

  return (
    <div className="space-y-6">
      <ReportFilters
        customers={customers}
        showCustomerFilter
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Destinations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDestinations}</div>
            <p className="text-xs text-muted-foreground">Unique MCC/MNC pairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Wholesale traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">vs {formatCurrency(totalCost)} cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Destination Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Destination Breakdown</CardTitle>
          <CardDescription>
            Traffic by MCC/MNC destination
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byDestination.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No wholesale traffic found for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>MCC</TableHead>
                  <TableHead>MNC</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDestination.map((item, index) => {
                  const profit = item.revenue - item.cost
                  const trafficShare = totalMessages > 0 ? (item.count / totalMessages) * 100 : 0
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.country}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.operator}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.mcc}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.mnc}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-500">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {formatCurrency(item.cost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {formatCurrency(profit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={trafficShare} className="h-2 w-16" />
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

export default async function WholesaleReportPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wholesale Report</h1>
        <p className="text-muted-foreground">
          Traffic and revenue analysis by destination (MCC/MNC)
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <WholesaleReportContent searchParams={params} />
      </Suspense>
    </div>
  )
}
