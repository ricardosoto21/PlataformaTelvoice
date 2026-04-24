'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { createCustomer, updateCustomer } from '@/lib/customer-actions'
import type { Customer, CustomerFormData, CustomerType, Currency } from '@/lib/types'

const customerTypes: { value: CustomerType; label: string }[] = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'RESELLER', label: 'Reseller' },
]

const currencies: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'CLP', label: 'CLP - Chilean Peso' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'ARS', label: 'ARS - Argentine Peso' },
  { value: 'COP', label: 'COP - Colombian Peso' },
  { value: 'PEN', label: 'PEN - Peruvian Sol' },
]

interface CustomerFormProps {
  customer?: Customer
  defaultRefNumber?: string
}

export function CustomerForm({ customer, defaultRefNumber }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!customer

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const data: CustomerFormData = {
      ref_number: formData.get('ref_number') as string,
      type: formData.get('type') as CustomerType,
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      currency: formData.get('currency') as Currency,
      balance: parseFloat(formData.get('balance') as string) || 0,
      credit_limit: parseFloat(formData.get('credit_limit') as string) || 0,
      active: formData.get('active') === 'on',
      notes: formData.get('notes') as string || undefined,
    }

    const result = isEditing
      ? await updateCustomer(customer.id, data)
      : await createCustomer(data)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard/customers')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Customer identification and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="ref_number">Reference Number</FieldLabel>
                  <Input
                    id="ref_number"
                    name="ref_number"
                    defaultValue={customer?.ref_number || defaultRefNumber}
                    required
                    readOnly={isEditing}
                    className={isEditing ? 'bg-muted' : ''}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="type">Customer Type</FieldLabel>
                  <Select name="type" defaultValue={customer?.type || 'CLIENT'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="name">Company/Customer Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={customer?.name}
                  required
                  placeholder="Enter customer name"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={customer?.email || ''}
                    placeholder="contact@company.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={customer?.phone || ''}
                    placeholder="+1 234 567 8900"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Billing Configuration</CardTitle>
            <CardDescription>Currency, balance, and credit settings</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Select name="currency" defaultValue={customer?.currency || 'USD'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="balance">Current Balance</FieldLabel>
                  <Input
                    id="balance"
                    name="balance"
                    type="number"
                    step="0.0001"
                    defaultValue={customer?.balance || 0}
                    placeholder="0.00"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="credit_limit">Credit Limit</FieldLabel>
                  <Input
                    id="credit_limit"
                    name="credit_limit"
                    type="number"
                    step="0.0001"
                    defaultValue={customer?.credit_limit || 0}
                    placeholder="0.00"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
            <CardDescription>Status and notes</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="active" className="text-base">Active Status</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this customer account
                  </p>
                </div>
                <Switch
                  id="active"
                  name="active"
                  defaultChecked={customer?.active ?? true}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={customer?.notes || ''}
                  placeholder="Internal notes about this customer..."
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </div>
    </form>
  )
}
