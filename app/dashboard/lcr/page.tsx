import Link from 'next/link'
import { Plus, GitBranch, Ban } from 'lucide-react'
import { getLcrRules, getLcrExclusions } from '@/lib/lcr-actions'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeleteLcrRuleButton } from './delete-lcr-rule-button'
import { DeleteLcrExclusionButton } from './delete-lcr-exclusion-button'

export default async function LcrPage() {
  const [rules, exclusions] = await Promise.all([
    getLcrRules(),
    getLcrExclusions(),
  ])

  const getConnectionBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>
      case 'RECONNECTING':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Reconnecting</Badge>
      default:
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LCR Rules</h1>
          <p className="text-muted-foreground">
            Least Cost Routing configuration by MCC/MNC
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/lcr/exclusions/new">
              <Ban className="mr-2 h-4 w-4" />
              Add Exclusion
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/lcr/new">
              <Plus className="mr-2 h-4 w-4" />
              New LCR Rule
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">
            <GitBranch className="mr-2 h-4 w-4" />
            Routing Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="exclusions">
            <Ban className="mr-2 h-4 w-4" />
            Exclusions ({exclusions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>LCR Routing Rules</CardTitle>
              <CardDescription>
                Define vendor priorities and costs per MCC/MNC
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GitBranch className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No LCR rules</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create routing rules to define vendor priorities.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/lcr/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New LCR Rule
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MCC</TableHead>
                      <TableHead>MNC</TableHead>
                      <TableHead>Country/Operator</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono">{rule.mcc}</TableCell>
                        <TableCell className="font-mono">{rule.mnc}</TableCell>
                        <TableCell>
                          <div>
                            {rule.country && <span>{rule.country}</span>}
                            {rule.operator && (
                              <p className="text-sm text-muted-foreground">{rule.operator}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{rule.vendor?.name}</span>
                            {getConnectionBadge(rule.vendor?.connection_status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {rule.cost ? `$${Number(rule.cost).toFixed(4)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {rule.route?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.active ? 'default' : 'secondary'}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/lcr/${rule.id}`}>
                                Edit
                              </Link>
                            </Button>
                            <DeleteLcrRuleButton id={rule.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exclusions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Exclusions</CardTitle>
              <CardDescription>
                Exclude specific vendors from certain MCC/MNC combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exclusions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ban className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No exclusions</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add exclusions to block certain vendor/destination combinations.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/lcr/exclusions/new">
                      <Ban className="mr-2 h-4 w-4" />
                      Add Exclusion
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MCC</TableHead>
                      <TableHead>MNC</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exclusions.map((exclusion) => (
                      <TableRow key={exclusion.id}>
                        <TableCell className="font-mono">{exclusion.mcc}</TableCell>
                        <TableCell className="font-mono">{exclusion.mnc}</TableCell>
                        <TableCell>{exclusion.vendor?.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {exclusion.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={exclusion.active ? 'destructive' : 'secondary'}>
                            {exclusion.active ? 'Blocked' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteLcrExclusionButton id={exclusion.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
