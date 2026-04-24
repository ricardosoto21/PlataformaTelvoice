import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getRatePlan, getRatePlanEntries } from '@/lib/rate-plan-actions'
import { Button } from '@/components/ui/button'
import { RatePlanForm } from '@/components/rate-plan-form'

interface EditRatePlanPageProps {
  params: Promise<{ id: string }>
}

export default async function EditRatePlanPage({ params }: EditRatePlanPageProps) {
  const { id } = await params

  let ratePlan
  let entries
  try {
    ratePlan = await getRatePlan(id)
    entries = await getRatePlanEntries(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rate-plans">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Rate Plan</h1>
          <p className="text-muted-foreground">
            Update {ratePlan.name}
          </p>
        </div>
      </div>

      <RatePlanForm ratePlan={ratePlan} entries={entries} />
    </div>
  )
}
