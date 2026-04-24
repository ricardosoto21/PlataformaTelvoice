import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SmppAccountForm } from '@/components/smpp-account-form'
import { getCustomers } from '@/lib/customer-actions'
import { generateSystemId, generatePassword } from '@/lib/smpp-account-actions'

export default async function NewSmppAccountPage() {
  const [customers, systemId, password] = await Promise.all([
    getCustomers(),
    generateSystemId(),
    generatePassword(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/smpp-accounts">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New SMPP Account</h1>
          <p className="text-muted-foreground">
            Create SMPP credentials for a customer
          </p>
        </div>
      </div>

      <SmppAccountForm 
        customers={customers} 
        defaultSystemId={systemId}
        defaultPassword={password}
      />
    </div>
  )
}
