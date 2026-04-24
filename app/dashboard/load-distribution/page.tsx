import Link from 'next/link'
import { Plus, PieChart } from 'lucide-react'
import { getLoadDistributions } from '@/lib/load-distribution-actions'
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
import { Progress } from '@/components/ui/progress'
import { DeleteLoadDistributionButton } from './delete-load-distribution-button'
import type { LoadDistribution } from '@/lib/types'

export default async function LoadDistributionPage() {
  const distributions = await getLoadDistributions()
  type GroupedDistribution = {
    customer: LoadDistribution['customer']
    distributions: LoadDistribution[]
  }

  // Group by customer for display
  const groupedByCustomer = distributions.reduce((acc, dist) => {
    const customerId = dist.customer_id
    if (!acc[customerId]) {
      acc[customerId] = {
        customer: dist.customer,
        distributions: [],
      }
    }
    acc[customerId].distributions.push(dist)
    return acc
  }, {} as Record<string, GroupedDistribution>)

  const getConnectionBadge = (status?: string | null) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Online</Badge>
      case 'RECONNECTING':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Reconnecting</Badge>
      default:
        return <Badge variant="secondary">Offline</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Load Distribution</h1>
          <p className="text-muted-foreground">
            Configure traffic distribution per customer and destination
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/load-distribution/new">
            <Plus className="mr-2 h-4 w-4" />
            New Distribution
          </Link>
        </Button>
      </div>

      {Object.keys(groupedByCustomer).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <PieChart className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No load distributions</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create distributions to split traffic across vendors.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/load-distribution/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Distribution
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedByCustomer) as [string, GroupedDistribution][]).map(([customerId, group]) => (
            <Card key={customerId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{group.customer?.name}</span>
                  <Badge variant="outline">{group.customer?.ref_number}</Badge>
                </CardTitle>
                <CardDescription>
                  {group.distributions.length} distribution rule{group.distributions.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MCC/MNC</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Load %</TableHead>
                      <TableHead className="w-48">Distribution</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.distributions.map((dist: LoadDistribution) => (
                      <TableRow key={dist.id}>
                        <TableCell className="font-mono">
                          {dist.mcc}/{dist.mnc}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{dist.vendor?.name}</span>
                            {getConnectionBadge(dist.vendor?.connection_status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{dist.load_percentage}%</span>
                        </TableCell>
                        <TableCell>
                          <Progress value={dist.load_percentage} className="h-2" />
                        </TableCell>
                        <TableCell>
                          <Badge variant={dist.active ? 'default' : 'secondary'}>
                            {dist.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/load-distribution/${dist.id}`}>
                                Edit
                              </Link>
                            </Button>
                            <DeleteLoadDistributionButton id={dist.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
