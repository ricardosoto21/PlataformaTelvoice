import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById } from '@/lib/invoice-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { DeleteInvoiceButton } from '@/components/invoices/delete-invoice-button'
import { InvoiceStatusButton } from '@/components/invoices/invoice-status-button'
import type { InvoiceStatus } from '@/lib/types'

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-secondary text-secondary-foreground',
  SENT: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
  PAID: 'bg-green-500/15 text-green-600 border-green-500/20',
  OVERDUE: 'bg-red-500/15 text-red-600 border-red-500/20',
  CANCELLED: 'bg-muted text-muted-foreground',
}

export default async function OutgoingInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await getInvoiceById(id).catch(() => null)
  if (!invoice || invoice.type !== 'OUTGOING') notFound()

  const customer = invoice.customer as any
  const items = invoice.items ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices/outgoing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight font-mono">
                {invoice.invoice_number}
              </h1>
              <Badge className={statusStyles[invoice.status as InvoiceStatus]}>
                {invoice.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(invoice.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceStatusButton id={invoice.id} currentStatus={invoice.status as InvoiceStatus} />
          {invoice.status === 'DRAFT' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/invoices/outgoing/${invoice.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          <DeleteInvoiceButton id={invoice.id} status={invoice.status as InvoiceStatus} type="OUTGOING" redirectAfter />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <Card>
            <CardContent className="pt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">From</p>
                <p className="font-semibold">TelvoiceSMS Platform</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Bill To</p>
                <p className="font-semibold">{customer?.company_name ?? '—'}</p>
                {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                {customer?.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-16">No line items</TableCell>
                    </TableRow>
                  ) : (
                    items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <span>{item.description}</span>
                          {(item.country || item.operator) && (
                            <span className="block text-xs text-muted-foreground">
                              {[item.country, item.operator].filter(Boolean).join(' · ')}
                              {item.mcc && ` · MCC ${item.mcc}`}
                              {item.mnc && `/${item.mnc}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{Number(item.quantity).toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{invoice.currency} {Number(item.unit_price).toFixed(6)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{invoice.currency} {Number(item.total).toFixed(4)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="space-y-1.5 text-sm ml-auto max-w-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{invoice.currency} {Number(invoice.subtotal).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
                  <span className="tabular-nums">{invoice.currency} {Number(invoice.tax).toFixed(4)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="tabular-nums">{invoice.currency} {Number(invoice.total).toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Period</p>
                <p className="mt-1">
                  {format(new Date(invoice.period_start), 'MMM d')} – {format(new Date(invoice.period_end), 'MMM d, yyyy')}
                </p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Due Date</p>
                  <p className="mt-1">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {invoice.sent_at && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sent</p>
                  <p className="mt-1">{format(new Date(invoice.sent_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              )}
              {invoice.paid_at && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paid</p>
                  <p className="mt-1">{format(new Date(invoice.paid_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Amount Due</p>
              <p className="text-3xl font-bold tabular-nums">
                {invoice.currency} {Number(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
