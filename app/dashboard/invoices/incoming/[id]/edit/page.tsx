import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceById } from '@/lib/invoice-actions'
import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function EditIncomingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [invoice, supabase] = await Promise.all([
    getInvoiceById(id).catch(() => null),
    createClient(),
  ])

  if (!invoice || invoice.type !== 'INCOMING' || invoice.status !== 'DRAFT') notFound()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/invoices/incoming/${id}`}>
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
        type="INCOMING"
        vendors={vendors ?? []}
        invoice={invoice as any}
        existingItems={(invoice.items ?? []) as any}
      />
    </div>
  )
}
