'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Users, Building2, Server, DollarSign, Activity, BarChart3, type LucideIcon } from 'lucide-react'

// Icon registry — only plain strings cross the RSC→Client boundary
export type StatIconName = 'users' | 'building2' | 'server' | 'dollar-sign' | 'activity' | 'bar-chart'

const ICON_MAP: Record<StatIconName, LucideIcon> = {
  'users': Users,
  'building2': Building2,
  'server': Server,
  'dollar-sign': DollarSign,
  'activity': Activity,
  'bar-chart': BarChart3,
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: StatIconName
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const Icon = ICON_MAP[icon]

  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-500',
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}% from last period
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              variantStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
