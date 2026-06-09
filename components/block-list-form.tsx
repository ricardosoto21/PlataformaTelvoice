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
import { createBlockList, updateBlockList } from '@/lib/block-list-actions'
import type { BlockList, CustomerOption, BlockListFormData, BlockListType, ScopeType } from '@/lib/types'

interface BlockListFormProps {
  blockList?: BlockList
  customers: CustomerOption[]
}

export default function BlockListForm({ blockList, customers }: BlockListFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<ScopeType>((blockList?.scope as ScopeType) ?? 'GLOBAL')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const data: BlockListFormData = {
      name: form.get('name') as string,
      type: form.get('type') as BlockListType,
      scope,
      customer_id: scope === 'CUSTOMER' ? (form.get('customer_id') as string) || undefined : undefined,
      value: form.get('value') as string,
      description: (form.get('description') as string) || undefined,
      active: form.get('active') === 'on',
    }

    try {
      if (blockList) {
        await updateBlockList(blockList.id, data)
      } else {
        await createBlockList(data)
      }
      router.push('/dashboard/block-lists')
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
              <Input id="name" name="name" defaultValue={blockList?.name} required placeholder="e.g. Block casino keywords" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
              <Select name="type" defaultValue={blockList?.type ?? 'KEYWORD'} required>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KEYWORD">Keyword</SelectItem>
                  <SelectItem value="NUMBER">Number</SelectItem>
                  <SelectItem value="SENDER_ID">Sender ID</SelectItem>
                  <SelectItem value="REGEX">Regex Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="value">Value / Pattern <span className="text-destructive">*</span></Label>
            <Input id="value" name="value" defaultValue={blockList?.value} required
              placeholder="Keyword, number, sender ID, or regex pattern" className="font-mono" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={blockList?.description ?? ''} rows={2} placeholder="Optional notes about this rule" />
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
                <SelectItem value="GLOBAL">Global — applies to all traffic</SelectItem>
                <SelectItem value="CUSTOMER">Customer — specific customer only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'CUSTOMER' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="customer_id">Customer <span className="text-destructive">*</span></Label>
              <Select name="customer_id" defaultValue={blockList?.customer_id ?? ''} required>
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
              <p className="text-xs text-muted-foreground">Enable or disable this block rule</p>
            </div>
            <Switch name="active" defaultChecked={blockList?.active ?? true} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : blockList ? 'Save Changes' : 'Create Rule'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/block-lists')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
