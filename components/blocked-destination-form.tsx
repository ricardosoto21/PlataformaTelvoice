'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createBlockedDestination, updateBlockedDestination } from '@/lib/blocked-destination-actions'
import type { BlockedDestination, CustomerOption, VendorOption, BlockedDestinationFormData, BlockedDestinationScope } from '@/lib/types'

interface BlockedDestinationFormProps {
  destination?: BlockedDestination
  customers: CustomerOption[]
  vendors: VendorOption[]
}

export default function BlockedDestinationForm({ destination, customers, vendors }: BlockedDestinationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<BlockedDestinationScope>((destination?.scope as BlockedDestinationScope) ?? 'GLOBAL')
  const [active, setActive] = useState(destination?.active ?? true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const data: BlockedDestinationFormData = {
      mcc: form.get('mcc') as string,
      mnc: (form.get('mnc') as string) || undefined,
      country: (form.get('country') as string) || undefined,
      operator: (form.get('operator') as string) || undefined,
      scope,
      customer_id: scope === 'CUSTOMER' ? (form.get('customer_id') as string) || undefined : undefined,
      vendor_id: scope === 'VENDOR' ? (form.get('vendor_id') as string) || undefined : undefined,
      reason: (form.get('reason') as string) || undefined,
      active,
    }

    try {
      if (destination) {
        await updateBlockedDestination(destination.id, data)
      } else {
        await createBlockedDestination(data)
      }
      router.push('/dashboard/blocked-destinations')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Destination</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mcc">MCC <span className="text-destructive">*</span></Label>
              <Input id="mcc" name="mcc" defaultValue={destination?.mcc} required
                placeholder="e.g. 730" className="font-mono" maxLength={3} />
              <p className="text-xs text-muted-foreground">Mobile Country Code (3 digits)</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mnc">MNC</Label>
              <Input id="mnc" name="mnc" defaultValue={destination?.mnc ?? ''} placeholder="e.g. 10 (blank = all networks)"
                className="font-mono" maxLength={3} />
              <p className="text-xs text-muted-foreground">Leave blank to block entire country</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={destination?.country ?? ''} placeholder="e.g. Chile" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="operator">Operator</Label>
              <Input id="operator" name="operator" defaultValue={destination?.operator ?? ''} placeholder="e.g. Entel" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" defaultValue={destination?.reason ?? ''} rows={2}
              placeholder="Why is this destination blocked?" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Block Scope</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Block For</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as BlockedDestinationScope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Global — block all traffic to this destination</SelectItem>
                <SelectItem value="CUSTOMER">Customer — block for a specific customer</SelectItem>
                <SelectItem value="VENDOR">Vendor — block a specific vendor from routing here</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'CUSTOMER' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer_id">Customer <span className="text-destructive">*</span></Label>
              <Select name="customer_id" defaultValue={destination?.customer_id ?? ''} required>
                <SelectTrigger id="customer_id"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.ref_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === 'VENDOR' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="vendor_id">Vendor <span className="text-destructive">*</span></Label>
              <Select name="vendor_id" defaultValue={destination?.vendor_id ?? ''} required>
                <SelectTrigger id="vendor_id"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Blocking Active</p>
              <p className="text-xs text-muted-foreground">Disable to temporarily allow traffic through</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : destination ? 'Save Changes' : 'Block Destination'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/blocked-destinations')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
