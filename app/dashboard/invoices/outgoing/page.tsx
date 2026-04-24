import { Suspense } from 'react'
import { getInvoices } from '@/lib/invoice-actions'
import { InvoiceList } from '@/components/invoices/invoice-list'
import { InvoiceSummaryCards } from '@/components/invoices/invoice-summary-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { Receipt } from 'lucide-react'

export default async function OutgoingInvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Outgoing Invoices</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoices issued to customers for SMS traffic.
        </p>
      </div>

      <Suspense fallback={<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>}>
        <InvoiceSummaryCards type="OUTGOING" />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
        <OutgoingInvoiceList />
      </Suspense>
    </div>
  )
}

async function OutgoingInvoiceList() {
  try {
    const invoices = await getInvoices('OUTGOING')
    return <InvoiceList invoices={invoices as any} type="OUTGOING" />
  } catch {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No invoices found or table not yet seeded.
      </div>
    )
  }
}
