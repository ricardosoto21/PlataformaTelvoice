'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { CalendarIcon, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ReportFiltersProps {
  customers?: { id: string; name: string; ref_number: string }[]
  vendors?: { id: string; name: string }[]
  showCustomerFilter?: boolean
  showVendorFilter?: boolean
  showStatusFilter?: boolean
  onExport?: () => void
}

export function ReportFilters({
  customers = [],
  vendors = [],
  showCustomerFilter = false,
  showVendorFilter = false,
  showStatusFilter = false,
  onExport,
}: ReportFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : subDays(new Date(), 7)
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : new Date()
  )
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || 'all')
  const [vendorId, setVendorId] = useState(searchParams.get('vendorId') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', format(startDate, 'yyyy-MM-dd'))
    if (endDate) params.set('endDate', format(endDate, 'yyyy-MM-dd'))
    if (customerId && customerId !== 'all') params.set('customerId', customerId)
    if (vendorId && vendorId !== 'all') params.set('vendorId', vendorId)
    if (status && status !== 'all') params.set('status', status)
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setStartDate(subDays(new Date(), 7))
    setEndDate(new Date())
    setCustomerId('all')
    setVendorId('all')
    setStatus('all')
    router.push('?')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'MMM dd') : 'Start'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground">to</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'MMM dd') : 'End'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {showCustomerFilter && customers.length > 0 && (
        <Select value={customerId} onValueChange={setCustomerId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.ref_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showVendorFilter && vendors.length > 0 && (
        <Select value={vendorId} onValueChange={setVendorId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showStatusFilter && (
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
          </SelectContent>
        </Select>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
        <Button size="sm" onClick={applyFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Apply
        </Button>
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  )
}
