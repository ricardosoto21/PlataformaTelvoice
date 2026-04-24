'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRoute, updateRoute } from '@/lib/route-actions'
import type { Route, RatePlan, RouteType } from '@/lib/types'
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

const routeTypes: RouteType[] = ['RETAIL', 'WHOLESALE']

interface RouteFormProps {
  route?: Route | null
  ratePlans: RatePlan[]
}

export function RouteForm({ route, ratePlans }: RouteFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: route?.name || '',
    type: route?.type || 'RETAIL' as RouteType,
    description: route?.description || '',
    rate_plan_id: route?.rate_plan_id || '',
    active: route?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        rate_plan_id: formData.rate_plan_id || undefined,
      }
      
      if (route) {
        await updateRoute(route.id, submitData)
      } else {
        await createRoute(submitData)
      }

      router.push('/dashboard/routes')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route')
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
          <CardTitle>Route Configuration</CardTitle>
          <CardDescription>
            Configure the routing path settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Route Name</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LATAM Retail Route"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Route Type</FieldLabel>
              <Select
                value={formData.type}
                onValueChange={(value: RouteType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {routeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="rate_plan_id">Rate Plan</FieldLabel>
              <Select
                value={formData.rate_plan_id}
                onValueChange={(value) => setFormData({ ...formData, rate_plan_id: value })}
              >
                <SelectTrigger id="rate_plan_id">
                  <SelectValue placeholder="Select a rate plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No rate plan</SelectItem>
                  {ratePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the route"
                rows={3}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : route ? 'Update Route' : 'Create Route'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/routes')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
