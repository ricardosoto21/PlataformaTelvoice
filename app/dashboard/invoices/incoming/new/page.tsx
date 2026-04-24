import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewIncomingInvoicePage() {
  const supabase = await createClient()
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices/incoming">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Incoming Invoice</h1>
          <p className="text-sm text-muted-foreground">Register an invoice received from a vendor.</p>
        </div>
      </div>
      <InvoiceForm type="INCOMING" vendors={vendors ?? []} />
    </div>
  )
}
