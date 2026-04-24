import Link from 'next/link'
import { Plus, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getBlockedDestinations } from '@/lib/blocked-destination-actions'
import DeleteBlockedDestinationButton from './delete-blocked-destination-button'

const SCOPE_COLORS: Record<string, string> = {
  GLOBAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  CUSTOMER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  VENDOR: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

export default async function BlockedDestinationsPage() {
  const destinations = await getBlockedDestinations()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
            <Ban className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Blocked Destinations</h1>
            <p className="text-sm text-muted-foreground">Block traffic to specific MCC/MNC destinations</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/blocked-destinations/new">
            <Plus className="h-4 w-4 mr-2" />
            Block Destination
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">{destinations?.length ?? 0} blocked destinations</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MCC</TableHead>
              <TableHead>MNC</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!destinations?.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No blocked destinations. Add one to restrict traffic.
                </TableCell>
              </TableRow>
            ) : (
              destinations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium text-foreground">{item.mcc}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{item.mnc ?? '*'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.country ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.operator ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[item.scope] ?? ''}`}>
                      {item.scope}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.scope === 'CUSTOMER' && (item.customer as any)?.name}
                    {item.scope === 'VENDOR' && (item.vendor as any)?.name}
                    {item.scope === 'GLOBAL' && <span className="text-muted-foreground/50">All traffic</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-36 truncate">{item.reason ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'destructive' : 'secondary'}>
                      {item.active ? 'Blocking' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/blocked-destinations/${item.id}`}>Edit</Link>
                      </Button>
                      <DeleteBlockedDestinationButton id={item.id} name={`${item.mcc}/${item.mnc ?? '*'}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
