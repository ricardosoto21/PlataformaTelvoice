import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getLcrRule } from '@/lib/lcr-actions'
import { getVendors } from '@/lib/vendor-actions'
import { getRoutes } from '@/lib/route-actions'
import { Button } from '@/components/ui/button'
import { LcrRuleForm } from '@/components/lcr-rule-form'

interface EditLcrRulePageProps {
  params: Promise<{ id: string }>
}

export default async function EditLcrRulePage({ params }: EditLcrRulePageProps) {
  const { id } = await params

  let lcrRule
  let vendors
  let routes
  try {
    lcrRule = await getLcrRule(id)
    vendors = await getVendors()
    routes = await getRoutes()
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/lcr">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit LCR Rule</h1>
          <p className="text-muted-foreground">
            Update routing for {lcrRule.mcc}/{lcrRule.mnc}
          </p>
        </div>
      </div>

      <LcrRuleForm lcrRule={lcrRule} vendors={vendors} routes={routes} />
    </div>
  )
}
