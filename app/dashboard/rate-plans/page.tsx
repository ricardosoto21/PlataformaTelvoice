import Link from 'next/link'
import { Plus, FileSpreadsheet } from 'lucide-react'
import { getRatePlans } from '@/lib/rate-plan-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteRatePlanButton } from './delete-rate-plan-button'

export default async function RatePlansPage() {
  const ratePlans = await getRatePlans()

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'RETAIL':
        return 'default'
      case 'WHOLESALE':
        return 'secondary'
      case 'TERMINATION':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rate Plans</h1>
          <p className="text-muted-foreground">
            Manage pricing plans with MCC/MNC rates
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/rate-plans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Rate Plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rate Plans</CardTitle>
          <CardDescription>
            {ratePlans.length} rate plan{ratePlans.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ratePlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No rate plans</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first rate plan to start configuring prices.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/rate-plans/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Rate Plan
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratePlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/rate-plans/${plan.id}`}
                        className="font-medium hover:underline"
                      >
                        {plan.name}
                      </Link>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {plan.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(plan.type)}>
                        {plan.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{plan.currency}</TableCell>
                    <TableCell>
                      <Badge variant={plan.active ? 'default' : 'secondary'}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(plan.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/rate-plans/${plan.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteRatePlanButton id={plan.id} name={plan.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
