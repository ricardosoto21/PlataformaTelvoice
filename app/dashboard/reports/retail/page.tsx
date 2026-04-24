import { Suspense } from 'react'
import { Users, MessageSquare, DollarSign, Percent } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportFilters } from '@/components/reports/report-filters'
import { getRetailReport, getCustomersForFilter } from '@/lib/report-actions'

interface PageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    customerId?: string
    country?: string
  }>
}

async function RetailReportContent({ searchParams }: { searchParams: Awaited<PageProps['searchParams']> }) {
  const filters = {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    customerId: searchParams.customerId,
    country: searchParams.country,
  }
  
  const [{ messages, byCustomer }, customers] = await Promise.all([
    getRetailReport(filters),
    getCustomersForFilter(),
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const totalMessages = messages.length
  const totalRevenue = byCustomer.reduce((sum, c) => sum + c.revenue, 0)
  const totalDelivered = byCustomer.reduce((sum, c) => sum + c.delivered, 0)
  const avgDeliveryRate = totalMessages > 0 ? (totalDelivered / totalMessages) * 100 : 0

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byCustomer.length}</div>
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
            <p className="text-xs text-muted-foreground">Retail traffic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Customer billing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryRate.toFixed(1)}%</div>
            <Progress value={avgDeliveryRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Customer Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Breakdown</CardTitle>
          <CardDescription>
            Traffic and revenue by customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byCustomer.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No customer traffic found for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">DLR Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Traffic Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCustomer.map((item, index) => {
                  const dlrRate = item.count > 0 ? (item.delivered / item.count) * 100 : 0
                  const trafficShare = totalMessages > 0 ? (item.count / totalMessages) * 100 : 0
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.customer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.customer?.ref_number || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-500">
                        {item.delivered.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={dlrRate >= 90 ? 'text-green-500' : dlrRate >= 70 ? 'text-yellow-500' : 'text-red-500'}>
                          {dlrRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-500">
                        {formatCurrency(item.revenue)}
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

export default async function RetailReportPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retail Report</h1>
        <p className="text-muted-foreground">
          Traffic and revenue analysis by customer
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <RetailReportContent searchParams={params} />
      </Suspense>
    </div>
  )
}
