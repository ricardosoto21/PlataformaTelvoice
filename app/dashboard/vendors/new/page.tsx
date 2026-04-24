import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VendorForm } from '@/components/vendor-form'

export default function NewVendorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vendors">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Vendor</h1>
          <p className="text-muted-foreground">
            Configure a new SMPP provider
          </p>
        </div>
      </div>

      <VendorForm />
    </div>
  )
}
