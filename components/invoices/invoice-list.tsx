'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Pencil, Plus } from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/lib/types'
import { format } from 'date-fns'
import { DeleteInvoiceButton } from './delete-invoice-button'
import { InvoiceStatusButton } from './invoice-status-button'

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Sent', variant: 'default' },
  PAID: { label: 'Paid', variant: 'default' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
}

interface InvoiceListProps {
  invoices: Invoice[]
  type: 'OUTGOING' | 'INCOMING'
}

export function InvoiceList({ invoices, type }: InvoiceListProps) {
  const basePath = type === 'OUTGOING' ? '/dashboard/invoices/outgoing' : '/dashboard/invoices/incoming'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </p>
        <Button asChild size="sm">
          <Link href={`${basePath}/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>{type === 'OUTGOING' ? 'Customer' : 'Vendor'}</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No invoices found. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => {
                const config = statusConfig[invoice.status]
                const party = type === 'OUTGOING'
                  ? (invoice.customer as any)?.company_name ?? '—'
                  : (invoice.vendor as any)?.name ?? '—'

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{party}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invoice.period_start), 'MMM d')} –{' '}
                      {format(new Date(invoice.period_end), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice.due_date
                        ? format(new Date(invoice.due_date), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {invoice.currency}{' '}
                      {Number(invoice.total).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={config.variant}
                        className={
                          invoice.status === 'PAID'
                            ? 'bg-green-500/15 text-green-600 border-green-500/20'
                            : invoice.status === 'OVERDUE'
                            ? 'bg-red-500/15 text-red-600 border-red-500/20'
                            : invoice.status === 'SENT'
                            ? 'bg-blue-500/15 text-blue-600 border-blue-500/20'
                            : ''
                        }
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`${basePath}/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {invoice.status === 'DRAFT' && (
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href={`${basePath}/${invoice.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <DeleteInvoiceButton id={invoice.id} status={invoice.status} type={type} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
