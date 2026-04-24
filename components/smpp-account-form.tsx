'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, RefreshCw, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { createSmppAccount, updateSmppAccount, generateSystemId, generatePassword } from '@/lib/smpp-account-actions'
import type { SmppAccount, SmppAccountFormData, Customer, BindMode } from '@/lib/types'

const bindModes: { value: BindMode; label: string }[] = [
  { value: 'TRX', label: 'Transceiver (TRX)' },
  { value: 'TX', label: 'Transmitter (TX)' },
  { value: 'RX', label: 'Receiver (RX)' },
]

const encodings = [
  { value: 'GSM', label: 'GSM 7-bit' },
  { value: 'UCS2', label: 'UCS-2 (Unicode)' },
  { value: 'LATIN1', label: 'Latin-1' },
  { value: 'ASCII', label: 'ASCII' },
]

interface SmppAccountFormProps {
  account?: SmppAccount & { customer?: { id: string; name: string; ref_number: string } | null }
  customers: Customer[]
  defaultSystemId?: string
  defaultPassword?: string
}

export function SmppAccountForm({ 
  account, 
  customers, 
  defaultSystemId,
  defaultPassword 
}: SmppAccountFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [systemId, setSystemId] = useState(account?.system_id || defaultSystemId || '')
  const [password, setPassword] = useState(account?.password || defaultPassword || '')
  const [allowedIps, setAllowedIps] = useState<string[]>(account?.allowed_ips || [])
  const [newIp, setNewIp] = useState('')

  const isEditing = !!account

  async function handleGenerateSystemId() {
    const newId = await generateSystemId()
    setSystemId(newId)
  }

  async function handleGeneratePassword() {
    const newPassword = await generatePassword()
    setPassword(newPassword)
  }

  function addIp() {
    if (newIp && !allowedIps.includes(newIp)) {
      setAllowedIps([...allowedIps, newIp])
      setNewIp('')
    }
  }

  function removeIp(ip: string) {
    setAllowedIps(allowedIps.filter(i => i !== ip))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const data: SmppAccountFormData = {
      customer_id: formData.get('customer_id') as string,
      system_id: systemId,
      password: password,
      allowed_ips: allowedIps.length > 0 ? allowedIps : undefined,
      port: parseInt(formData.get('port') as string) || 2775,
      bind_mode: formData.get('bind_mode') as BindMode || 'TRX',
      max_connections: parseInt(formData.get('max_connections') as string) || 1,
      throughput: parseInt(formData.get('throughput') as string) || 10,
      ton: parseInt(formData.get('ton') as string) || 1,
      npi: parseInt(formData.get('npi') as string) || 1,
      encoding: formData.get('encoding') as string || 'GSM',
      active: formData.get('active') === 'on',
    }

    const result = isEditing
      ? await updateSmppAccount(account.id, data)
      : await createSmppAccount(data)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard/smpp-accounts')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4 flex gap-3 items-center text-sm text-blue-600 dark:text-blue-400">
            <Server className="h-4 w-4 shrink-0" />
            <p>
              <strong>Customer Account:</strong> This section is for managing SMPP credentials for customers who connect <em>to</em> our platform. 
              To configure connections <em>to</em> external SMPP providers, use the <strong>Vendors</strong> section.
            </p>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Link this SMPP account to a customer</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="customer_id">Customer</FieldLabel>
                <Select 
                  name="customer_id" 
                  defaultValue={account?.customer_id}
                  required
                >
                  <SelectTrigger>
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
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>SMPP authentication credentials for the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="system_id">System ID</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="system_id"
                    value={systemId}
                    onChange={(e) => setSystemId(e.target.value)}
                    required
                    placeholder="e.g., TVCUST001"
                    className="font-mono"
                    readOnly={isEditing}
                  />
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateSystemId}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGeneratePassword}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>SMPP connection parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="port">Port</FieldLabel>
                  <Input
                    id="port"
                    name="port"
                    type="number"
                    defaultValue={account?.port || 2775}
                    min={1}
                    max={65535}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="bind_mode">Bind Mode</FieldLabel>
                  <Select name="bind_mode" defaultValue={account?.bind_mode || 'TRX'}>
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
                <Field>
                  <FieldLabel htmlFor="encoding">Encoding</FieldLabel>
                  <Select name="encoding" defaultValue={account?.encoding || 'GSM'}>
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

              <div className="grid gap-4 sm:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="max_connections">Max Connections</FieldLabel>
                  <Input
                    id="max_connections"
                    name="max_connections"
                    type="number"
                    defaultValue={account?.max_connections || 1}
                    min={1}
                    max={10}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="throughput">Throughput (msg/s)</FieldLabel>
                  <Input
                    id="throughput"
                    name="throughput"
                    type="number"
                    defaultValue={account?.throughput || 10}
                    min={1}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ton">TON</FieldLabel>
                  <Input
                    id="ton"
                    name="ton"
                    type="number"
                    defaultValue={account?.ton || 1}
                    min={0}
                    max={6}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="npi">NPI</FieldLabel>
                  <Input
                    id="npi"
                    name="npi"
                    type="number"
                    defaultValue={account?.npi || 1}
                    min={0}
                    max={14}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Allowed IP Addresses</FieldLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allowedIps.map((ip) => (
                    <Badge key={ip} variant="secondary" className="gap-1 font-mono">
                      {ip}
                      <button
                        type="button"
                        onClick={() => removeIp(ip)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {allowedIps.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No IP restrictions (all IPs allowed)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    className="font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addIp()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addIp}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Account activation settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Field className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
              <div className="flex flex-col gap-0.5">
                <FieldLabel htmlFor="active" className="text-base">Active Status</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this SMPP account
                </p>
              </div>
              <Switch
                id="active"
                name="active"
                defaultChecked={account?.active ?? true}
              />
            </Field>
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
            {loading ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </div>
    </form>
  )
}
