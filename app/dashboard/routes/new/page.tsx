import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getRatePlans } from '@/lib/rate-plan-actions'
import { Button } from '@/components/ui/button'
import { RouteForm } from '@/components/route-form'

export default async function NewRoutePage() {
  const ratePlans = await getRatePlans()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/routes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Route</h1>
          <p className="text-muted-foreground">
            Create a new routing path for SMS traffic
          </p>
        </div>
      </div>

      <RouteForm ratePlans={ratePlans} />
    </div>
  )
}
