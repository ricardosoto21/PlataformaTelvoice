import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RatePlanForm } from '@/components/rate-plan-form'

export default function NewRatePlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rate-plans">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Rate Plan</h1>
          <p className="text-muted-foreground">
            Create a new pricing plan with MCC/MNC rates
          </p>
        </div>
      </div>

      <RatePlanForm />
    </div>
  )
}
