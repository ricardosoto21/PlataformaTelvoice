'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createLcrRule, updateLcrRule, getCountries, getOperatorsByCountry, createBulkLcrRules } from '@/lib/lcr-actions'
import type { LcrRule, Vendor, Route, MccMnc } from '@/lib/types'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

interface LcrRuleFormProps {
  lcrRule?: LcrRule | null
  vendors: Vendor[]
  routes: Route[]
}

export function LcrRuleForm({ lcrRule, vendors, routes }: LcrRuleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual')

  // Manual mode state & common routing configs
  const [formData, setFormData] = useState({
    mcc: lcrRule?.mcc || '',
    mnc: lcrRule?.mnc || '',
    country: lcrRule?.country || '',
    operator: lcrRule?.operator || '',
    vendor_id: lcrRule?.vendor_id || '',
    route_id: lcrRule?.route_id || 'none',
    priority: lcrRule?.priority || 1,
    cost: lcrRule?.cost || 0,
    active: lcrRule?.active ?? true,
  })

  // Bulk mode states
  const [countries, setCountries] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [operators, setOperators] = useState<MccMnc[]>([])
  const [selectedOperators, setSelectedOperators] = useState<Set<string>>(new Set())
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingOperators, setIsLoadingOperators] = useState(false)

  // Fetch countries
  useEffect(() => {
    if (mode === 'bulk' && countries.length === 0) {
      setIsLoadingCountries(true)
      getCountries()
        .then(setCountries)
        .catch(err => setError(err.message))
        .finally(() => setIsLoadingCountries(false))
    }
  }, [mode, countries.length])

  // Fetch operators
  useEffect(() => {
    if (selectedCountry) {
      setIsLoadingOperators(true)
      getOperatorsByCountry(selectedCountry)
        .then(data => {
          setOperators(data)
          // By default, select all operators
          setSelectedOperators(new Set(data.map(op => op.id)))
        })
        .catch(err => setError(err.message))
        .finally(() => setIsLoadingOperators(false))
    } else {
      setOperators([])
      setSelectedOperators(new Set())
    }
  }, [selectedCountry])

  const toggleOperator = (opId: string) => {
    const next = new Set(selectedOperators)
    if (next.has(opId)) {
      next.delete(opId)
    } else {
      next.add(opId)
    }
    setSelectedOperators(next)
  }

  const toggleAllOperators = () => {
    if (selectedOperators.size === operators.length) {
      setSelectedOperators(new Set())
    } else {
      setSelectedOperators(new Set(operators.map(op => op.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'manual' || lcrRule) {
        const submitData = {
          ...formData,
          route_id: formData.route_id === 'none' ? undefined : formData.route_id || undefined,
          cost: formData.cost || undefined,
        }

        if (lcrRule) {
          await updateLcrRule(lcrRule.id, submitData)
        } else {
          await createLcrRule(submitData)
        }
      } else {
        // Bulk creation
        if (selectedOperators.size === 0) throw new Error("Please select at least one operator")
        if (!formData.vendor_id) throw new Error("Please select a vendor")
        
        const selectedOpsData = operators.filter(op => selectedOperators.has(op.id))
        const bulkRules = selectedOpsData.map(op => ({
          mcc: op.mcc,
          mnc: op.mnc,
          country: op.country,
          operator: op.operator,
          vendor_id: formData.vendor_id,
          route_id: formData.route_id === 'none' ? undefined : formData.route_id || undefined,
          priority: formData.priority,
          cost: formData.cost || undefined,
          active: formData.active,
        }))

        await createBulkLcrRules(bulkRules)
      }

      router.push('/dashboard/lcr')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LCR rule(s)')
      setIsSubmitting(false)
      return
    }
  }

  const manualDestinationCard = (
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
              required={mode === 'manual'}
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
              required={mode === 'manual'}
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
  )

  const bulkDestinationCard = (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Destination</CardTitle>
        <CardDescription>
          Select a country to automatically create rules for all its operators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field>
          <FieldLabel htmlFor="bulk_country">Country</FieldLabel>
          <Select
            value={selectedCountry}
            onValueChange={setSelectedCountry}
            disabled={isLoadingCountries}
          >
            <SelectTrigger id="bulk_country">
              <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select a country"} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {isLoadingOperators && <p className="text-sm text-muted-foreground">Loading operators...</p>}

        {operators.length > 0 && (
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center space-x-2 pb-2 mb-2 border-b">
              <Checkbox 
                id="select-all" 
                checked={selectedOperators.size === operators.length && operators.length > 0}
                onCheckedChange={toggleAllOperators}
              />
              <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select All ({operators.length} operators)
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
              {operators.map(op => (
                <div key={op.id} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`op-${op.id}`} 
                    checked={selectedOperators.has(op.id)}
                    onCheckedChange={() => toggleOperator(op.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor={`op-${op.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {op.operator}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      MCC: {op.mcc} | MNC: {op.mnc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {lcrRule ? (
        manualDestinationCard
      ) : (
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'bulk')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="bulk">Bulk by Country</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            {manualDestinationCard}
          </TabsContent>
          <TabsContent value="bulk">
            {bulkDestinationCard}
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Routing Configuration</CardTitle>
          <CardDescription>
            {mode === 'bulk' && !lcrRule 
              ? "These settings will be applied to ALL selected operators" 
              : "Define the vendor and routing priority"}
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
                  <SelectItem value="none">No route</SelectItem>
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
          {isSubmitting 
            ? 'Saving...' 
            : lcrRule 
              ? 'Update Rule' 
              : mode === 'bulk' 
                ? `Create ${selectedOperators.size} Rules` 
                : 'Create Rule'}
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
