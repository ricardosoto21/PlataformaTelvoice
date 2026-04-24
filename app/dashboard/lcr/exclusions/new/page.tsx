import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getVendors } from '@/lib/vendor-actions'
import { Button } from '@/components/ui/button'
import { LcrExclusionForm } from '@/components/lcr-exclusion-form'

export default async function NewLcrExclusionPage() {
  const vendors = await getVendors()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/lcr">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Exclusion</h1>
          <p className="text-muted-foreground">
            Block a vendor from specific destinations
          </p>
        </div>
      </div>

      <LcrExclusionForm vendors={vendors} />
    </div>
  )
}
