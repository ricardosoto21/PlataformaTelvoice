'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, X, Plus, Trash2 } from 'lucide-react'
import { createRatePlan, updateRatePlan, createRatePlanEntriesBulk, deleteAllRatePlanEntries } from '@/lib/rate-plan-actions'
import type { RatePlan, RatePlanEntry, Currency, RatePlanType } from '@/lib/types'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FieldGroup,
  Field,
  FieldLabel,
} from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const currencies: Currency[] = ['USD', 'EUR', 'CLP', 'MXN', 'BRL', 'ARS', 'COP', 'PEN']
const ratePlanTypes: RatePlanType[] = ['RETAIL', 'WHOLESALE', 'TERMINATION']

interface RatePlanFormProps {
  ratePlan?: RatePlan | null
  entries?: RatePlanEntry[]
}

interface ParsedEntry {
  country: string
  country_code: string
  mcc: string
  mnc: string
  operator: string
  rate: number
}

export function RatePlanForm({ ratePlan, entries = [] }: RatePlanFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([])
  const [importError, setImportError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: ratePlan?.name || '',
    currency: ratePlan?.currency || 'USD' as Currency,
    type: ratePlan?.type || 'RETAIL' as RatePlanType,
    description: ratePlan?.description || '',
    active: ratePlan?.active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      let plan: RatePlan
      if (ratePlan) {
        plan = await updateRatePlan(ratePlan.id, formData)
      } else {
        plan = await createRatePlan(formData)
      }

      // If there are parsed entries from Excel, save them
      if (parsedEntries.length > 0) {
        if (ratePlan) {
          // Delete existing entries first
          await deleteAllRatePlanEntries(ratePlan.id)
        }
        await createRatePlanEntriesBulk(
          parsedEntries.map(entry => ({
            rate_plan_id: plan.id,
            ...entry,
          }))
        )
      }

      router.push('/dashboard/rate-plans')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rate plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const parseExcelContent = useCallback((content: string) => {
    const lines = content.trim().split('\n')
    const parsed: ParsedEntry[] = []
    setImportError(null)

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle both comma and tab separated values
      const separator = line.includes('\t') ? '\t' : ','
      const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''))

      if (values.length >= 5) {
        const rate = parseFloat(values[5] || values[4])
        if (isNaN(rate)) continue

        parsed.push({
          country: values[0] || '',
          country_code: values[1] || '',
          mcc: values[2] || '',
          mnc: values[3] || '',
          operator: values[4] || '',
          rate: rate,
        })
      }
    }

    if (parsed.length === 0) {
      setImportError('No valid entries found. Expected format: Country, Country Code, MCC, MNC, Operator, Rate')
    } else {
      setParsedEntries(parsed)
    }
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      parseExcelContent(content)
    }
    reader.readAsText(file)
  }, [parseExcelContent])

  const removeEntry = (index: number) => {
    setParsedEntries(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllEntries = () => {
    setParsedEntries([])
    setImportError(null)
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
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure the rate plan details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Plan Name</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LATAM Standard Rates"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Plan Type</FieldLabel>
              <Select
                value={formData.type}
                onValueChange={(value: RatePlanType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ratePlanTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Select
                value={formData.currency}
                onValueChange={(value: Currency) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
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
                placeholder="Optional description of the rate plan"
                rows={3}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Entries</CardTitle>
          <CardDescription>
            Import rates from CSV/Excel or add manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import">
            <TabsList className="mb-4">
              <TabsTrigger value="import">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </TabsTrigger>
              <TabsTrigger value="entries">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Entries ({parsedEntries.length + entries.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Upload Rate File</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  CSV or TSV file with columns: Country, Country Code, MCC, MNC, Operator, Rate
                </p>
                <div className="mt-4">
                  <Input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>
              </div>

              {importError && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {importError}
                </div>
              )}

              {parsedEntries.length > 0 && (
                <div className="flex items-center justify-between rounded-md bg-primary/10 p-4">
                  <span className="text-sm font-medium">
                    {parsedEntries.length} entries ready to import
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={clearAllEntries}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="entries">
              {parsedEntries.length === 0 && entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4">No rate entries yet. Import a file to add rates.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>MCC</TableHead>
                        <TableHead>MNC</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedEntries.map((entry, index) => (
                        <TableRow key={`new-${index}`}>
                          <TableCell>{entry.country}</TableCell>
                          <TableCell>{entry.country_code}</TableCell>
                          <TableCell>{entry.mcc}</TableCell>
                          <TableCell>{entry.mnc}</TableCell>
                          <TableCell>{entry.operator}</TableCell>
                          <TableCell>{entry.rate.toFixed(6)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEntry(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.country}</TableCell>
                          <TableCell>{entry.country_code}</TableCell>
                          <TableCell>{entry.mcc}</TableCell>
                          <TableCell>{entry.mnc}</TableCell>
                          <TableCell>{entry.operator}</TableCell>
                          <TableCell>{Number(entry.rate).toFixed(6)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : ratePlan ? 'Update Rate Plan' : 'Create Rate Plan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/rate-plans')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
