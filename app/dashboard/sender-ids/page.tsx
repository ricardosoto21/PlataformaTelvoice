import Link from 'next/link'
import { Plus, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getSenderIds } from '@/lib/sender-id-actions'
import DeleteSenderIdButton from './delete-sender-id-button'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  INACTIVE: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

const TYPE_COLORS: Record<string, string> = {
  ALPHANUMERIC: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  NUMERIC: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  SHORTCODE: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

export default async function SenderIdsPage() {
  const senderIds = await getSenderIds()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AtSign className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sender IDs</h1>
            <p className="text-sm text-muted-foreground">Manage allowed sender identifiers</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/sender-ids/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Sender ID
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">{senderIds?.length ?? 0} sender IDs</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>MCC</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!senderIds?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No sender IDs found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              senderIds.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium text-foreground">{item.sender_id}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? ''}`}>
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? ''}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.scope === 'GLOBAL' ? 'secondary' : 'outline'}>
                      {item.scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(item.customer as any)?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.country ?? '—'}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{item.mcc ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/sender-ids/${item.id}`}>Edit</Link>
                      </Button>
                      <DeleteSenderIdButton id={item.id} name={item.sender_id} />
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
