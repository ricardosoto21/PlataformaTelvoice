import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCustomers } from '@/lib/customer-actions'
import { getVendors } from '@/lib/vendor-actions'
import { Button } from '@/components/ui/button'
import { LoadDistributionForm } from '@/components/load-distribution-form'

export default async function NewLoadDistributionPage() {
  const [customers, vendors] = await Promise.all([
    getCustomers(),
    getVendors(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/load-distribution">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Load Distribution</h1>
          <p className="text-muted-foreground">
            Configure traffic distribution for a customer
          </p>
        </div>
      </div>

      <LoadDistributionForm customers={customers} vendors={vendors} />
    </div>
  )
}
