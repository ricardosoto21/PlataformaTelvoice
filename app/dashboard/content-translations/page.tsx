import Link from 'next/link'
import { Plus, Languages, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getContentTranslations } from '@/lib/content-translation-actions'
import DeleteContentTranslationButton from './delete-content-translation-button'

const MATCH_COLORS: Record<string, string> = {
  EXACT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  CONTAINS: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  REGEX: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  STARTS_WITH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ENDS_WITH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export default async function ContentTranslationsPage() {
  const rules = await getContentTranslations()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Languages className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Content Rules</h1>
            <p className="text-sm text-muted-foreground">Text replacement and translation rules for message content</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/content-translations/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">{rules?.length ?? 0} rules</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Match Type</TableHead>
              <TableHead>Transformation</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rules?.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No content rules found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">#{item.priority}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${MATCH_COLORS[item.match_type] ?? ''}`}>
                      {item.match_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-64">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-24 bg-muted px-1.5 py-0.5 rounded">{item.source_text}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs text-teal-400 truncate max-w-24 bg-teal-500/10 px-1.5 py-0.5 rounded">{item.target_text}</span>
                    </div>
                  </TableCell>
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
                        <Link href={`/dashboard/content-translations/${item.id}`}>Edit</Link>
                      </Button>
                      <DeleteContentTranslationButton id={item.id} name={item.name} />
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
