'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLcrExclusion } from '@/lib/lcr-actions'
import type { Vendor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  FieldGroup,
  Field,
  FieldLabel,
} from '@/components/ui/field'

interface LcrExclusionFormProps {
  vendors: Vendor[]
}

export function LcrExclusionForm({ vendors }: LcrExclusionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    mcc: '',
    mnc: '',
    vendor_id: '',
    reason: '',
    active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await createLcrExclusion(formData)
      router.push('/dashboard/lcr')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exclusion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exclusion Details</CardTitle>
          <CardDescription>
            Block a vendor from a specific MCC/MNC destination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="mcc">MCC (Mobile Country Code)</FieldLabel>
              <Input
                id="mcc"
                value={formData.mcc}
                onChange={(e) => setFormData({ ...formData, mcc: e.target.value })}
                placeholder="e.g., 730"
                required
                maxLength={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="mnc">MNC (Mobile Network Code)</FieldLabel>
              <Input
                id="mnc"
                value={formData.mnc}
                onChange={(e) => setFormData({ ...formData, mnc: e.target.value })}
                placeholder="e.g., 01"
                required
                maxLength={3}
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="vendor_id">Vendor to Exclude</FieldLabel>
              <Select
                value={formData.vendor_id}
                onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
                required
              >
                <SelectTrigger id="vendor_id">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="reason">Reason (Optional)</FieldLabel>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Poor delivery rates, Compliance issues"
                rows={3}
              />
            </Field>

            <Field className="flex items-center gap-4">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <FieldLabel htmlFor="active" className="!mt-0">
                Active (Block traffic)
              </FieldLabel>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Exclusion'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/lcr')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
