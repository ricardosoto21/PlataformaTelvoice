'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { createInvoice, updateInvoice, upsertInvoiceItems } from '@/lib/invoice-actions'
import type { Customer, Invoice, InvoiceItem, InvoiceItemFormData, Vendor } from '@/lib/types'

interface InvoiceFormProps {
  type: 'OUTGOING' | 'INCOMING'
  customers?: Customer[]
  vendors?: Vendor[]
  invoice?: Invoice
  existingItems?: InvoiceItem[]
}

const EMPTY_ITEM: InvoiceItemFormData = {
  description: '',
  quantity: 1,
  unit_price: 0,
  total: 0,
}

export function InvoiceForm({ type, customers = [], vendors = [], invoice, existingItems = [] }: InvoiceFormProps) {
  const router = useRouter()
  const basePath = type === 'OUTGOING' ? '/dashboard/invoices/outgoing' : '/dashboard/invoices/incoming'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [partyId, setPartyId] = useState(
    type === 'OUTGOING' ? (invoice?.customer_id ?? '') : (invoice?.vendor_id ?? '')
  )
  const [periodStart, setPeriodStart] = useState(invoice?.period_start ?? '')
  const [periodEnd, setPeriodEnd] = useState(invoice?.period_end ?? '')
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? '')
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate ?? 0)
  const [currency, setCurrency] = useState(invoice?.currency ?? 'USD')
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [items, setItems] = useState<InvoiceItemFormData[]>(
    existingItems.length > 0
      ? existingItems.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total, mcc: i.mcc ?? '', mnc: i.mnc ?? '', country: i.country ?? '', operator: i.operator ?? '' }))
      : [{ ...EMPTY_ITEM }]
  )

  const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const updateItem = useCallback((index: number, field: keyof InvoiceItemFormData, value: string | number) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : updated[index].quantity
        const price = field === 'unit_price' ? Number(value) : updated[index].unit_price
        updated[index].total = qty * price
      }
      return updated
    })
  }, [])

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = {
        type,
        customer_id: type === 'OUTGOING' ? partyId : undefined,
        vendor_id: type === 'INCOMING' ? partyId : undefined,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDate || undefined,
        subtotal,
        tax_rate: taxRate,
        tax,
        total,
        currency,
        status: (invoice?.status ?? 'DRAFT') as any,
        notes: notes || undefined,
      }

      if (invoice) {
        await updateInvoice(invoice.id, formData)
        await upsertInvoiceItems(invoice.id, items)
        router.push(`${basePath}/${invoice.id}`)
      } else {
        const created = await createInvoice(formData, items)
        router.push(`${basePath}/${created.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{type === 'OUTGOING' ? 'Customer' : 'Vendor'}</Label>
            <Select value={partyId} onValueChange={setPartyId} required>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${type === 'OUTGOING' ? 'customer' : 'vendor'}...`} />
              </SelectTrigger>
              <SelectContent>
                {(type === 'OUTGOING' ? customers : vendors).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {type === 'OUTGOING' ? p.company_name : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'GBP', 'MXN', 'COP', 'BRL'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Period Start</Label>
            <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Period End</Label>
            <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={taxRate}
              onChange={e => setTaxRate(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header row */}
          <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-muted-foreground sm:grid">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1" />
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-5">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={e => updateItem(index, 'description', e.target.value)}
                  required
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => updateItem(index, 'quantity', e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={e => updateItem(index, 'unit_price', e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="col-span-3 sm:col-span-2 text-right text-sm font-medium tabular-nums">
                {currency} {item.total.toFixed(4)}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{currency} {subtotal.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="font-medium tabular-nums">{currency} {tax.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{currency} {total.toFixed(4)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Optional notes or payment instructions..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : invoice ? 'Save Changes' : 'Create Invoice'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
