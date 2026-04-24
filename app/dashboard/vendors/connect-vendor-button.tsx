'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Play, PowerOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ConnectVendorButton({ id, status }: { id: string, status: string }) {
  const router = useRouter()

  const handleConnect = async () => {
    // Llamamos a tu API interna para encender el Vendor
    await fetch(`/api/smpp/vendors/${id}/connect`, { method: 'POST' })
    router.refresh() // Refrescamos la tabla para ver el nuevo estado
  }

  const handleDisconnect = async () => {
    // Llamamos a tu API interna para apagar el Vendor
    await fetch(`/api/smpp/vendors/${id}/disconnect`, { method: 'POST' })
    router.refresh()
  }

  if (status === 'CONNECTED' || status === 'RECONNECTING') {
    return (
      <DropdownMenuItem onClick={handleDisconnect} className="text-red-600 focus:text-red-600 cursor-pointer">
        <PowerOff className="mr-2 h-4 w-4" />
        Disconnect
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem onClick={handleConnect} className="text-green-600 focus:text-green-600 cursor-pointer">
      <Play className="mr-2 h-4 w-4" />
      Connect
    </DropdownMenuItem>
  )
}