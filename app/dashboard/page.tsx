import { Suspense } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { TrafficAreaChart, TrafficBarChart } from '@/components/dashboard/traffic-chart'
import { VendorTrafficCard } from '@/components/dashboard/vendor-traffic'
import { TopCustomersCard } from '@/components/dashboard/top-customers'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { BSSStatsCard } from '@/components/dashboard/bss-stats'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getDashboardStats,
  getTrafficStats,
  getVendorTrafficStats,
  getTopCustomers,
  getRecentActivity,
  getBSSStats,
} from '@/lib/dashboard-actions'

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

function ListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

async function StatsSection() {
  const stats = await getDashboardStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Customers"
        value={stats.totalCustomers}
        subtitle={`${stats.activeCustomers} active`}
        icon="users"
        variant="default"
      />
      <StatCard
        title="Vendors"
        value={stats.totalVendors}
        subtitle={`${stats.connectedVendors} connected`}
        icon="building2"
        variant={stats.connectedVendors > 0 ? 'success' : 'warning'}
      />
      <StatCard
        title="SMPP Accounts"
        value={stats.totalSmppAccounts}
        subtitle={`${stats.activeSmppAccounts} active`}
        icon="server"
        variant="default"
      />
      <StatCard
        title="Rate Plans"
        value={stats.totalRatePlans}
        subtitle={`${stats.totalRoutes} routes configured`}
        icon="dollar-sign"
        variant="default"
      />
    </div>
  )
}

async function TrafficSection() {
  const [trafficStats, vendorStats] = await Promise.all([
    getTrafficStats(7),
    getVendorTrafficStats(),
  ])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <TrafficAreaChart
          data={trafficStats}
          title="Message Traffic (7 Days)"
          description="Submitted vs Delivered messages"
        />
      </div>
      <VendorTrafficCard data={vendorStats} />
    </div>
  )
}

async function DeliveryStatsSection() {
  const trafficStats = await getTrafficStats(7)

  return (
    <TrafficBarChart
      data={trafficStats}
      title="Delivery Status"
      description="Message delivery breakdown by status"
    />
  )
}

async function CustomersAndBSSSection() {
  const [customers, bssStats] = await Promise.all([
    getTopCustomers(5),
    getBSSStats(),
  ])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TopCustomersCard data={customers} />
      <BSSStatsCard data={bssStats} />
    </div>
  )
}

async function ActivitySection() {
  const activities = await getRecentActivity(8)

  return <ActivityFeed data={activities} />
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to TelvoiceSMS Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-emerald-500">System Online</span>
          </div>
        </div>
      </div>

      {/* Monitoring Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <StatsSection />
      </Suspense>

      {/* Traffic Charts */}
      <Suspense
        fallback={
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
            <ListSkeleton />
          </div>
        }
      >
        <TrafficSection />
      </Suspense>

      {/* Delivery Status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <DeliveryStatsSection />
          </Suspense>
        </div>
        <Suspense fallback={<ListSkeleton />}>
          <ActivitySection />
        </Suspense>
      </div>

      {/* Customers & BSS */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            <ListSkeleton />
            <ListSkeleton />
          </div>
        }
      >
        <CustomersAndBSSSection />
      </Suspense>
    </div>
  )
}
