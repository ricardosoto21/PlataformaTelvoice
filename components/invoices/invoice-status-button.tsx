'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Send, CheckCircle, XCircle } from 'lucide-react'
import { updateInvoiceStatus } from '@/lib/invoice-actions'
import type { InvoiceStatus } from '@/lib/types'

interface InvoiceStatusButtonProps {
  id: string
  currentStatus: InvoiceStatus
}

const transitions: Record<InvoiceStatus, { label: string; next: InvoiceStatus; icon: React.ElementType }[]> = {
  DRAFT: [{ label: 'Mark as Sent', next: 'SENT', icon: Send }],
  SENT: [
    { label: 'Mark as Paid', next: 'PAID', icon: CheckCircle },
    { label: 'Mark as Overdue', next: 'OVERDUE', icon: XCircle },
  ],
  OVERDUE: [{ label: 'Mark as Paid', next: 'PAID', icon: CheckCircle }],
  PAID: [],
  CANCELLED: [],
}

export function InvoiceStatusButton({ id, currentStatus }: InvoiceStatusButtonProps) {
  const [loading, setLoading] = useState(false)
  const options = transitions[currentStatus]

  if (options.length === 0) return null

  async function handleChange(next: InvoiceStatus) {
    setLoading(true)
    try {
      await updateInvoiceStatus(id, next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? 'Updating...' : 'Change Status'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((opt) => (
          <DropdownMenuItem key={opt.next} onClick={() => handleChange(opt.next)}>
            <opt.icon className="mr-2 h-4 w-4" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
