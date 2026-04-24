import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VendorForm } from '@/components/vendor-form'
import { getVendor } from '@/lib/vendor-actions'

interface EditVendorPageProps {
  params: Promise<{ id: string }>
}

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const { id } = await params
  const vendor = await getVendor(id)

  if (!vendor) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vendors">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Vendor</h1>
          <p className="text-muted-foreground">
            {vendor.name}
          </p>
        </div>
      </div>

      <VendorForm vendor={vendor} />
    </div>
  )
}
