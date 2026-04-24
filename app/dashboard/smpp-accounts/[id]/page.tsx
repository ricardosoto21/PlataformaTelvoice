import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SmppAccountForm } from '@/components/smpp-account-form'
import { getSmppAccount } from '@/lib/smpp-account-actions'
import { getCustomers } from '@/lib/customer-actions'

interface EditSmppAccountPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSmppAccountPage({ params }: EditSmppAccountPageProps) {
  const { id } = await params
  const [account, customers] = await Promise.all([
    getSmppAccount(id),
    getCustomers(),
  ])

  if (!account) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/smpp-accounts">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit SMPP Account</h1>
          <p className="text-muted-foreground font-mono">
            {account.system_id}
          </p>
        </div>
      </div>

      <SmppAccountForm account={account} customers={customers} />
    </div>
  )
}
