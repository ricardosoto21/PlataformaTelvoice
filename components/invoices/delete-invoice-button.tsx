'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteInvoice } from '@/lib/invoice-actions'
import type { InvoiceStatus } from '@/lib/types'

interface DeleteInvoiceButtonProps {
  id: string
  status: InvoiceStatus
  type: 'OUTGOING' | 'INCOMING'
  redirectAfter?: boolean
}

export function DeleteInvoiceButton({ id, status, type, redirectAfter }: DeleteInvoiceButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (status !== 'DRAFT' && status !== 'CANCELLED') return null

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteInvoice(id)
      if (redirectAfter) {
        const base = type === 'OUTGOING' ? '/dashboard/invoices/outgoing' : '/dashboard/invoices/incoming'
        router.push(base)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The invoice and all its line items will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
