import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getRoute } from '@/lib/route-actions'
import { getRatePlans } from '@/lib/rate-plan-actions'
import { Button } from '@/components/ui/button'
import { RouteForm } from '@/components/route-form'

interface EditRoutePageProps {
  params: Promise<{ id: string }>
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
  const { id } = await params

  let route
  let ratePlans
  try {
    route = await getRoute(id)
    ratePlans = await getRatePlans()
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/routes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Route</h1>
          <p className="text-muted-foreground">
            Update {route.name}
          </p>
        </div>
      </div>

      <RouteForm route={route} ratePlans={ratePlans} />
    </div>
  )
}
