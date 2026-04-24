'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
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
import { createVendor, updateVendor } from '@/lib/vendor-actions'
import type { Vendor, VendorFormData, BindMode } from '@/lib/types'

const bindModes: { value: BindMode; label: string; description: string }[] = [
  { value: 'TRX', label: 'Transceiver (TRX)', description: 'Send and receive messages' },
  { value: 'TX', label: 'Transmitter (TX)', description: 'Send messages only' },
  { value: 'RX', label: 'Receiver (RX)', description: 'Receive messages only' },
]

const encodings = [
  { value: 'GSM', label: 'GSM 7-bit' },
  { value: 'UCS2', label: 'UCS-2 (Unicode)' },
  { value: 'LATIN1', label: 'Latin-1' },
  { value: 'ASCII', label: 'ASCII' },
]

interface VendorFormProps {
  vendor?: Vendor
}

export function VendorForm({ vendor }: VendorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const isEditing = !!vendor

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const data: VendorFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      active: formData.get('active') === 'on',
      smpp_host: formData.get('smpp_host') as string || undefined,
      smpp_port: parseInt(formData.get('smpp_port') as string) || 2775,
      smpp_system_id: formData.get('smpp_system_id') as string || undefined,
      smpp_password: formData.get('smpp_password') as string || undefined,
      smpp_system_type: formData.get('smpp_system_type') as string || undefined,
      smpp_bind_mode: formData.get('smpp_bind_mode') as BindMode || 'TRX',
      smpp_max_connections: parseInt(formData.get('smpp_max_connections') as string) || 1,
      smpp_throughput: parseInt(formData.get('smpp_throughput') as string) || 100,
      smpp_ton: parseInt(formData.get('smpp_ton') as string) || 1,
      smpp_npi: parseInt(formData.get('smpp_npi') as string) || 1,
      smpp_encoding: formData.get('smpp_encoding') as string || 'GSM',
      smpp_keep_alive_interval: parseInt(formData.get('smpp_keep_alive_interval') as string) || 30,
      notes: formData.get('notes') as string || undefined,
    }

    const result = isEditing
      ? await updateVendor(vendor.id, data)
      : await createVendor(data)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard/vendors')
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
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>Basic vendor identification and contact</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="name">Vendor Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={vendor?.name}
                  required
                  placeholder="Enter vendor name"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={vendor?.email || ''}
                    placeholder="contact@vendor.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={vendor?.phone || ''}
                    placeholder="+1 234 567 8900"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>SMPP Configuration</CardTitle>
            <CardDescription>Connection settings for the SMPP provider</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="smpp_host">SMPP Host</FieldLabel>
                  <Input
                    id="smpp_host"
                    name="smpp_host"
                    defaultValue={vendor?.smpp_host || ''}
                    placeholder="smpp.vendor.com"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_port">SMPP Port</FieldLabel>
                  <Input
                    id="smpp_port"
                    name="smpp_port"
                    type="number"
                    defaultValue={vendor?.smpp_port || 2775}
                    placeholder="2775"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="smpp_system_id">System ID</FieldLabel>
                  <Input
                    id="smpp_system_id"
                    name="smpp_system_id"
                    defaultValue={vendor?.smpp_system_id || ''}
                    placeholder="username"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="smpp_password"
                      name="smpp_password"
                      type={showPassword ? 'text' : 'password'}
                      defaultValue={vendor?.smpp_password || ''}
                      placeholder="Enter password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="smpp_system_type">System Type</FieldLabel>
                  <Input
                    id="smpp_system_type"
                    name="smpp_system_type"
                    defaultValue={vendor?.smpp_system_type || ''}
                    placeholder="e.g., VMA, OTA"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_bind_mode">Bind Mode</FieldLabel>
                  <Select name="smpp_bind_mode" defaultValue={vendor?.smpp_bind_mode || 'TRX'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bind mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {bindModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Performance Settings</CardTitle>
            <CardDescription>Connection limits and throughput configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="smpp_max_connections">Max Connections</FieldLabel>
                  <Input
                    id="smpp_max_connections"
                    name="smpp_max_connections"
                    type="number"
                    defaultValue={vendor?.smpp_max_connections || 1}
                    min={1}
                    max={100}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_throughput">Throughput (msg/s)</FieldLabel>
                  <Input
                    id="smpp_throughput"
                    name="smpp_throughput"
                    type="number"
                    defaultValue={vendor?.smpp_throughput || 100}
                    min={1}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_keep_alive_interval">Keep Alive (s)</FieldLabel>
                  <Input
                    id="smpp_keep_alive_interval"
                    name="smpp_keep_alive_interval"
                    type="number"
                    defaultValue={vendor?.smpp_keep_alive_interval || 30}
                    min={10}
                    max={300}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="smpp_ton">TON (Type of Number)</FieldLabel>
                  <Input
                    id="smpp_ton"
                    name="smpp_ton"
                    type="number"
                    defaultValue={vendor?.smpp_ton || 1}
                    min={0}
                    max={6}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_npi">NPI (Numbering Plan)</FieldLabel>
                  <Input
                    id="smpp_npi"
                    name="smpp_npi"
                    type="number"
                    defaultValue={vendor?.smpp_npi || 1}
                    min={0}
                    max={14}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="smpp_encoding">Encoding</FieldLabel>
                  <Select name="smpp_encoding" defaultValue={vendor?.smpp_encoding || 'GSM'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select encoding" />
                    </SelectTrigger>
                    <SelectContent>
                      {encodings.map((enc) => (
                        <SelectItem key={enc.value} value={enc.value}>
                          {enc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    Enable or disable this vendor connection
                  </p>
                </div>
                <Switch
                  id="active"
                  name="active"
                  defaultChecked={vendor?.active ?? true}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={vendor?.notes || ''}
                  placeholder="Internal notes about this vendor..."
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
            {loading ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
          </Button>
        </div>
      </div>
    </form>
  )
}
