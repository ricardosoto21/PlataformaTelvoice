import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getVendors } from '@/lib/vendor-actions'
import { getRoutes } from '@/lib/route-actions'
import { Button } from '@/components/ui/button'
import { LcrRuleForm } from '@/components/lcr-rule-form'

export default async function NewLcrRulePage() {
  const [vendors, routes] = await Promise.all([
    getVendors(),
    getRoutes(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/lcr">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New LCR Rule</h1>
          <p className="text-muted-foreground">
            Create a new routing rule for a MCC/MNC destination
          </p>
        </div>
      </div>

      <LcrRuleForm vendors={vendors} routes={routes} />
    </div>
  )
}
