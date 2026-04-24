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
import { createSenderId, updateSenderId } from '@/lib/sender-id-actions'
import type { SenderIdRecord, CustomerOption, SenderIdFormData, ScopeType, SenderIdType, SenderIdStatus } from '@/lib/types'

interface SenderIdFormProps {
  senderIdRecord?: SenderIdRecord
  customers: CustomerOption[]
}

export default function SenderIdForm({ senderIdRecord, customers }: SenderIdFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<ScopeType>((senderIdRecord?.scope as ScopeType) ?? 'GLOBAL')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const data: SenderIdFormData = {
      sender_id: form.get('sender_id') as string,
      scope,
      customer_id: scope === 'CUSTOMER' ? (form.get('customer_id') as string) || undefined : undefined,
      type: form.get('type') as SenderIdType,
      status: form.get('status') as SenderIdStatus,
      country: (form.get('country') as string) || undefined,
      country_code: (form.get('country_code') as string) || undefined,
      mcc: (form.get('mcc') as string) || undefined,
      description: (form.get('description') as string) || undefined,
      active: form.get('active') === 'on',
    }

    try {
      if (senderIdRecord) {
        await updateSenderId(senderIdRecord.id, data)
      } else {
        await createSenderId(data)
      }
      router.push('/dashboard/sender-ids')
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
        <CardHeader><CardTitle className="text-base">Sender ID Details</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sender_id">Sender ID <span className="text-destructive">*</span></Label>
            <Input id="sender_id" name="sender_id" defaultValue={senderIdRecord?.sender_id}
              required placeholder="e.g. MyBrand or +14155551234" className="font-mono" />
            <p className="text-xs text-muted-foreground">Alphanumeric max 11 chars, or E.164 number, or short code</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
              <Select name="type" defaultValue={senderIdRecord?.type ?? 'ALPHANUMERIC'} required>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALPHANUMERIC">Alphanumeric</SelectItem>
                  <SelectItem value="NUMERIC">Numeric</SelectItem>
                  <SelectItem value="SHORTCODE">Short Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
              <Select name="status" defaultValue={senderIdRecord?.status ?? 'ACTIVE'} required>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={senderIdRecord?.description ?? ''} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Scope & Geography</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Apply To</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ScopeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Global — all customers</SelectItem>
                <SelectItem value="CUSTOMER">Customer — specific customer only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'CUSTOMER' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer_id">Customer <span className="text-destructive">*</span></Label>
              <Select name="customer_id" defaultValue={senderIdRecord?.customer_id ?? ''} required>
                <SelectTrigger id="customer_id"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.ref_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={senderIdRecord?.country ?? ''} placeholder="e.g. Chile" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="country_code">Country Code</Label>
              <Input id="country_code" name="country_code" defaultValue={senderIdRecord?.country_code ?? ''} placeholder="e.g. CL" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mcc">MCC</Label>
              <Input id="mcc" name="mcc" defaultValue={senderIdRecord?.mcc ?? ''} placeholder="e.g. 730" className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Enable or disable this sender ID</p>
            </div>
            <Switch name="active" defaultChecked={senderIdRecord?.active ?? true} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : senderIdRecord ? 'Save Changes' : 'Add Sender ID'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/sender-ids')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
