'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { createContentTranslation, updateContentTranslation } from '@/lib/content-translation-actions'
import type { ContentTranslation, Customer, ContentTranslationFormData, ScopeType, MatchType } from '@/lib/types'

interface ContentTranslationFormProps {
  rule?: ContentTranslation
  customers: Customer[]
}

export default function ContentTranslationForm({ rule, customers }: ContentTranslationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<ScopeType>((rule?.scope as ScopeType) ?? 'GLOBAL')
  const [caseSensitive, setCaseSensitive] = useState(rule?.case_sensitive ?? false)
  const [active, setActive] = useState(rule?.active ?? true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const data: ContentTranslationFormData = {
      name: form.get('name') as string,
      scope,
      customer_id: scope === 'CUSTOMER' ? (form.get('customer_id') as string) || undefined : undefined,
      match_type: form.get('match_type') as MatchType,
      source_text: form.get('source_text') as string,
      target_text: form.get('target_text') as string,
      case_sensitive: caseSensitive,
      active,
      priority: parseInt(form.get('priority') as string) || 1,
      description: (form.get('description') as string) || undefined,
    }

    try {
      if (rule) {
        await updateContentTranslation(rule.id, data)
      } else {
        await createContentTranslation(data)
      }
      router.push('/dashboard/content-translations')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Rule Details</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Rule Name <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" defaultValue={rule?.name} required placeholder="e.g. Replace URL shortener" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" type="number" min={1} defaultValue={rule?.priority ?? 1} />
              <p className="text-xs text-muted-foreground">Lower number = higher priority</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="match_type">Match Type <span className="text-destructive">*</span></Label>
            <Select name="match_type" defaultValue={rule?.match_type ?? 'CONTAINS'} required>
              <SelectTrigger id="match_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTAINS">Contains</SelectItem>
                <SelectItem value="EXACT">Exact Match</SelectItem>
                <SelectItem value="STARTS_WITH">Starts With</SelectItem>
                <SelectItem value="ENDS_WITH">Ends With</SelectItem>
                <SelectItem value="REGEX">Regular Expression</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="source_text">Source Text <span className="text-destructive">*</span></Label>
              <Textarea id="source_text" name="source_text" defaultValue={rule?.source_text} required
                rows={3} placeholder="Text to match..." className="font-mono text-sm resize-none" />
            </div>
            <div className="pb-3">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="target_text">Target Text <span className="text-destructive">*</span></Label>
              <Textarea id="target_text" name="target_text" defaultValue={rule?.target_text} required
                rows={3} placeholder="Replace with..." className="font-mono text-sm resize-none" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Case Sensitive</p>
              <p className="text-xs text-muted-foreground">Match uppercase and lowercase exactly</p>
            </div>
            <Switch checked={caseSensitive} onCheckedChange={setCaseSensitive} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={rule?.description ?? ''} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Scope</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Apply To</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ScopeType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Global — all messages</SelectItem>
                <SelectItem value="CUSTOMER">Customer — specific customer only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === 'CUSTOMER' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer_id">Customer <span className="text-destructive">*</span></Label>
              <Select name="customer_id" defaultValue={rule?.customer_id ?? ''} required>
                <SelectTrigger id="customer_id"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.ref_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Enable or disable this translation rule</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : rule ? 'Save Changes' : 'Create Rule'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/content-translations')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
