'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteSmppAccount } from '@/lib/smpp-account-actions'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteSmppAccountButtonProps {
  id: string
  systemId: string
}

export function DeleteSmppAccountButton({ id, systemId }: DeleteSmppAccountButtonProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const result = await deleteSmppAccount(id)
    setLoading(false)

    if (result.error) {
      console.error('Error deleting SMPP account:', result.error)
    } else {
      setShowDialog(false)
      router.refresh()
    }
  }

  return (
    <>
      <DropdownMenuItem
        onClick={() => setShowDialog(true)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SMPP Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete SMPP account <strong>{systemId}</strong>? 
              This action cannot be undone and will immediately terminate any active connections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
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
    </>
  )
}
