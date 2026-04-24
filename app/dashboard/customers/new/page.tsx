import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm } from '@/components/customer-form'
import { generateRefNumber } from '@/lib/customer-actions'

export default async function NewCustomerPage() {
  const refNumber = await generateRefNumber()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/customers">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground">
            Create a new customer account
          </p>
        </div>
      </div>

      <CustomerForm defaultRefNumber={refNumber} />
    </div>
  )
}
