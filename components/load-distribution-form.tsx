'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLoadDistribution, updateLoadDistribution } from '@/lib/load-distribution-actions'
import type { LoadDistribution, Customer, Vendor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import {
  FieldGroup,
  Field,
  FieldLabel,
} from '@/components/ui/field'

interface LoadDistributionFormProps {
  distribution?: LoadDistribution | null
  customers: Customer[]
  vendors: Vendor[]
}

export function LoadDistributionForm({ distribution, customers, vendors }: LoadDistributionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_id: distribution?.customer_id || '',
    mcc: distribution?.mcc || '',
    mnc: distribution?.mnc || '',
    vendor_id: distribution?.vendor_id || '',
    load_percentage: distribution?.load_percentage || 50,
    active: distribution?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (distribution) {
        await updateLoadDistribution(distribution.id, formData)
      } else {
        await createLoadDistribution(formData)
      }

      router.push('/dashboard/load-distribution')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save distribution')
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
          <CardTitle>Customer & Destination</CardTitle>
          <CardDescription>
            Select the customer and MCC/MNC destination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="customer_id">Customer</FieldLabel>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                required
              >
                <SelectTrigger id="customer_id">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.ref_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

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
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribution Configuration</CardTitle>
          <CardDescription>
            Set the vendor and traffic percentage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="vendor_id">Vendor</FieldLabel>
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
                      {vendor.name} ({vendor.connection_status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="load_percentage">
                Load Percentage: {formData.load_percentage}%
              </FieldLabel>
              <div className="space-y-4">
                <Slider
                  id="load_percentage"
                  value={[formData.load_percentage]}
                  onValueChange={([value]) => setFormData({ ...formData, load_percentage: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <Progress value={formData.load_percentage} className="h-3" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Percentage of traffic to route through this vendor for the specified destination
              </p>
            </Field>

            <Field className="flex items-center gap-4">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <FieldLabel htmlFor="active" className="!mt-0">
                Active
              </FieldLabel>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : distribution ? 'Update Distribution' : 'Create Distribution'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/load-distribution')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
