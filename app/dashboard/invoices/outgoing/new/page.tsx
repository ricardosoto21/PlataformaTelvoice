import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { CustomerOption } from '@/lib/types'

export default async function NewOutgoingInvoicePage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, ref_number')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices/outgoing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Outgoing Invoice</h1>
          <p className="text-sm text-muted-foreground">Create an invoice to bill a customer.</p>
        </div>
      </div>
      <InvoiceForm type="OUTGOING" customers={(customers ?? []) as CustomerOption[]} />
    </div>
  )
}
