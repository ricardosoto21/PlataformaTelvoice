'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Building2, CreditCard, MapPin, Loader2, Save, CheckCircle } from 'lucide-react'

type EntitySettings = {
  id: string
  company_name: string
  legal_name: string | null
  tax_id: string | null
  registration_no: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  bank_name: string | null
  bank_account: string | null
  bank_iban: string | null
  bank_swift: string | null
}

export default function EntitySettingsPage() {
  const supabase = createClient()
  const [data, setData] = useState<EntitySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('entity_settings').select('*').limit(1).single()
      .then(({ data }) => { setData(data); setLoading(false) })
  }, [])

  const handleChange = (key: keyof EntitySettings, value: string) => {
    if (!data) return
    setData({ ...data, [key]: value })
    setSaved(false)
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    await supabase.from('entity_settings').update({
      company_name: data.company_name,
      legal_name: data.legal_name,
      tax_id: data.tax_id,
      registration_no: data.registration_no,
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
      phone: data.phone,
      email: data.email,
      website: data.website,
      bank_name: data.bank_name,
      bank_account: data.bank_account,
      bank_iban: data.bank_iban,
      bank_swift: data.bank_swift,
      updated_at: new Date().toISOString(),
    }).eq('id', data.id)
    setSaving(false)
    setSaved(true)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (!data) return null

  const field = (label: string, key: keyof EntitySettings, placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={(data[key] as string) ?? ''}
        placeholder={placeholder ?? label}
        onChange={(e) => handleChange(key, e.target.value)}
        className="h-9"
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entity Settings</h1>
          <p className="text-muted-foreground">Company legal information and banking details</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Company Information</CardTitle>
            </div>
            <CardDescription>Legal name, tax ID and registration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {field('Company Name', 'company_name')}
            {field('Legal Name', 'legal_name')}
            {field('Tax ID / VAT', 'tax_id')}
            {field('Registration Number', 'registration_no')}
            {field('Email', 'email', 'billing@example.com')}
            {field('Phone', 'phone', '+1 555 000 0000')}
            {field('Website', 'website', 'https://example.com')}
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Address</CardTitle>
            </div>
            <CardDescription>Registered address for invoices and legal documents</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {field('Address Line 1', 'address_line1')}
            {field('Address Line 2', 'address_line2', 'Suite, floor, etc.')}
            <div className="grid grid-cols-2 gap-3">
              {field('City', 'city')}
              {field('State / Province', 'state')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('Postal Code', 'postal_code')}
              {field('Country', 'country', 'US')}
            </div>
          </CardContent>
        </Card>

        {/* Banking */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Banking Details</CardTitle>
            </div>
            <CardDescription>Used for invoices and wire transfer references</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {field('Bank Name', 'bank_name')}
            {field('Account Number', 'bank_account')}
            {field('IBAN', 'bank_iban')}
            {field('SWIFT / BIC', 'bank_swift')}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
