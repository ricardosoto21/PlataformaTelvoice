'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, DollarSign, Route, Wallet } from 'lucide-react'
import type { RecentActivity } from '@/lib/dashboard-actions'
import { formatDistanceToNow } from 'date-fns'

interface ActivityFeedProps {
  data: RecentActivity[]
}

const activityIcons = {
  customer_created: Users,
  vendor_connected: Building2,
  rate_plan_updated: DollarSign,
  route_created: Route,
  balance_recharge: Wallet,
}

const activityColors = {
  customer_created: 'bg-blue-500/10 text-blue-500',
  vendor_connected: 'bg-emerald-500/10 text-emerald-500',
  rate_plan_updated: 'bg-amber-500/10 text-amber-500',
  route_created: 'bg-purple-500/10 text-purple-500',
  balance_recharge: 'bg-primary/10 text-primary',
}

export function ActivityFeed({ data }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            data.map((activity) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
