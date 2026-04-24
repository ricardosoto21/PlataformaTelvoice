'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLcrRule, updateLcrRule } from '@/lib/lcr-actions'
import type { LcrRule, Vendor, Route } from '@/lib/types'
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
import {
  FieldGroup,
  Field,
  FieldLabel,
} from '@/components/ui/field'

interface LcrRuleFormProps {
  lcrRule?: LcrRule | null
  vendors: Vendor[]
  routes: Route[]
}

export function LcrRuleForm({ lcrRule, vendors, routes }: LcrRuleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    mcc: lcrRule?.mcc || '',
    mnc: lcrRule?.mnc || '',
    country: lcrRule?.country || '',
    operator: lcrRule?.operator || '',
    vendor_id: lcrRule?.vendor_id || '',
    route_id: lcrRule?.route_id || '',
    priority: lcrRule?.priority || 1,
    cost: lcrRule?.cost || 0,
    active: lcrRule?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        route_id: formData.route_id || undefined,
        cost: formData.cost || undefined,
      }

      if (lcrRule) {
        await updateLcrRule(lcrRule.id, submitData)
      } else {
        await createLcrRule(submitData)
      }

      router.push('/dashboard/lcr')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LCR rule')
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
          <CardTitle>Destination</CardTitle>
          <CardDescription>
            Specify the MCC/MNC for this routing rule
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

            <Field>
              <FieldLabel htmlFor="country">Country (Optional)</FieldLabel>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., Chile"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="operator">Operator (Optional)</FieldLabel>
              <Input
                id="operator"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                placeholder="e.g., Entel"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Routing Configuration</CardTitle>
          <CardDescription>
            Define the vendor and routing priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 md:grid-cols-2">
            <Field>
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

            <Field>
              <FieldLabel htmlFor="route_id">Route (Optional)</FieldLabel>
              <Select
                value={formData.route_id}
                onValueChange={(value) => setFormData({ ...formData, route_id: value })}
              >
                <SelectTrigger id="route_id">
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No route</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="priority">Priority</FieldLabel>
              <Input
                id="priority"
                type="number"
                min={1}
                max={100}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower number = higher priority (1 is highest)
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="cost">Cost per SMS (Optional)</FieldLabel>
              <Input
                id="cost"
                type="number"
                step="0.0001"
                min={0}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                placeholder="0.0000"
              />
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
          {isSubmitting ? 'Saving...' : lcrRule ? 'Update Rule' : 'Create Rule'}
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
