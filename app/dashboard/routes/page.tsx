import Link from 'next/link'
import { Plus, Route as RouteIcon } from 'lucide-react'
import { getRoutes } from '@/lib/route-actions'
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
import { DeleteRouteButton } from './delete-route-button'

export default async function RoutesPage() {
  const routes = await getRoutes()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground">
            Configure routing paths for SMS traffic
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/routes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Route
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
          <CardDescription>
            {routes.length} route{routes.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RouteIcon className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No routes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first route to configure SMS traffic paths.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/routes/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Route
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rate Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/routes/${route.id}`}
                        className="font-medium hover:underline"
                      >
                        {route.name}
                      </Link>
                      {route.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {route.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={route.type === 'RETAIL' ? 'default' : 'secondary'}>
                        {route.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {route.rate_plan ? (
                        <span className="text-sm">
                          {route.rate_plan.name} ({route.rate_plan.currency})
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No rate plan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={route.active ? 'default' : 'secondary'}>
                        {route.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(route.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/routes/${route.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteRouteButton id={route.id} name={route.name} />
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
