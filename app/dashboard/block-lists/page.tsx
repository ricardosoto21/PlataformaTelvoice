import Link from 'next/link'
import { Plus, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getBlockLists } from '@/lib/block-list-actions'
import DeleteBlockListButton from './delete-block-list-button'

const TYPE_COLORS: Record<string, string> = {
  KEYWORD: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  NUMBER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SENDER_ID: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  REGEX: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

export default async function BlockListsPage() {
  const blockLists = await getBlockLists()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
            <ShieldX className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Block Lists</h1>
            <p className="text-sm text-muted-foreground">Manage keyword, number, and sender ID blocks</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/block-lists/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Block Rule
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">{blockLists?.length ?? 0} rules</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!blockLists?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No block rules found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              blockLists.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type] ?? ''}`}>
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-48 truncate">{item.value}</TableCell>
                  <TableCell>
                    <Badge variant={item.scope === 'GLOBAL' ? 'secondary' : 'outline'}>
                      {item.scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(item.customer as any)?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'default' : 'secondary'}>
                      {item.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/block-lists/${item.id}`}>Edit</Link>
                      </Button>
                      <DeleteBlockListButton id={item.id} name={item.name} />
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
