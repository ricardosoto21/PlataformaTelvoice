'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { VendorTraffic } from '@/lib/dashboard-actions'

interface VendorTrafficProps {
  data: VendorTraffic[]
}

export function VendorTrafficCard({ data }: VendorTrafficProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const maxMessages = Math.max(...data.map(v => v.messages), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Traffic</CardTitle>
        <CardDescription>Message distribution by vendor</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active vendors
            </p>
          ) : (
            data.map((vendor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{vendor.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {formatNumber(vendor.messages)} msgs
                    </span>
                    <span
                      className={
                        vendor.deliveryRate >= 95
                          ? 'text-emerald-500'
                          : vendor.deliveryRate >= 90
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }
                    >
                      {vendor.deliveryRate.toFixed(1)}% DLR
                    </span>
                  </div>
                </div>
                <Progress
                  value={(vendor.messages / maxMessages) * 100}
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
