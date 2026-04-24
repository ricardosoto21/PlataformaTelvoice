import { Suspense } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, DollarSign, MessageSquare, CheckCircle, XCircle, Percent } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportFilters } from '@/components/reports/report-filters'
import { getFinanceReport, getCustomersForFilter, getVendorsForFilter } from '@/lib/report-actions'

interface PageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    customerId?: string
    vendorId?: string
    status?: string
  }>
}

async function FinanceReportContent({ searchParams }: { searchParams: Awaited<PageProps['searchParams']> }) {
  const filters = {
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    customerId: searchParams.customerId,
    vendorId: searchParams.vendorId,
    status: searchParams.status as any,
  }
  
  const [{ messages, summary }, customers, vendors] = await Promise.all([
    getFinanceReport(filters),
    getCustomersForFilter(),
    getVendorsForFilter(),
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DELIVERED: 'default',
      SUBMITTED: 'secondary',
      PENDING: 'outline',
      FAILED: 'destructive',
      REJECTED: 'destructive',
      EXPIRED: 'secondary',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <ReportFilters
        customers={customers}
        vendors={vendors}
        showCustomerFilter
        showVendorFilter
        showStatusFilter
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMessages.toLocaleString()}</div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-3 w-3" /> {summary.delivered.toLocaleString()} delivered
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-3 w-3" /> {summary.failed.toLocaleString()} failed
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From customer billing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cost</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">Vendor termination cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary.profit)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Percent className="h-3 w-3" />
                <span>{summary.margin.toFixed(2)}% margin</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Showing {messages.length} most recent transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No messages found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.slice(0, 100).map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(msg.submitted_at), 'MMM dd HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{msg.source_addr}</TableCell>
                      <TableCell className="font-mono text-sm">{msg.dest_addr}</TableCell>
                      <TableCell>{msg.country || '-'}</TableCell>
                      <TableCell>{getStatusBadge(msg.status)}</TableCell>
                      <TableCell className="text-right text-green-500">
                        {formatCurrency(Number(msg.customer_rate) || 0)}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {formatCurrency(Number(msg.vendor_rate) || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency((Number(msg.customer_rate) || 0) - (Number(msg.vendor_rate) || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

export default async function FinanceReportPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Report</h1>
        <p className="text-muted-foreground">
          Revenue, cost, and profit analysis across all traffic
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <FinanceReportContent searchParams={params} />
      </Suspense>
    </div>
  )
}
