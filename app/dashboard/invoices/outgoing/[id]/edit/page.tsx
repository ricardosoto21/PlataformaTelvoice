import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById } from '@/lib/invoice-actions'
import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CustomerOption, Invoice, InvoiceItem } from '@/lib/types'

export default async function EditOutgoingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [invoice, supabase] = await Promise.all([
    getInvoiceById(id).catch(() => null),
    createClient(),
  ])

  if (!invoice || invoice.type !== 'OUTGOING' || invoice.status !== 'DRAFT') notFound()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, ref_number')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/invoices/outgoing/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit {invoice.invoice_number}
          </h1>
          <p className="text-sm text-muted-foreground">Update invoice details and line items.</p>
        </div>
      </div>
      <InvoiceForm
        type="OUTGOING"
        customers={(customers ?? []) as CustomerOption[]}
        invoice={invoice as Invoice}
        existingItems={(invoice.items ?? []) as InvoiceItem[]}
      />
    </div>
  )
}
