import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getLoadDistribution } from '@/lib/load-distribution-actions'
import { getCustomers } from '@/lib/customer-actions'
import { getVendors } from '@/lib/vendor-actions'
import { Button } from '@/components/ui/button'
import { LoadDistributionForm } from '@/components/load-distribution-form'

interface EditLoadDistributionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditLoadDistributionPage({ params }: EditLoadDistributionPageProps) {
  const { id } = await params

  let distribution
  let customers
  let vendors
  try {
    distribution = await getLoadDistribution(id)
    customers = await getCustomers()
    vendors = await getVendors()
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/load-distribution">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Load Distribution</h1>
          <p className="text-muted-foreground">
            Update distribution for {distribution.customer?.name}
          </p>
        </div>
      </div>

      <LoadDistributionForm distribution={distribution} customers={customers} vendors={vendors} />
    </div>
  )
}
