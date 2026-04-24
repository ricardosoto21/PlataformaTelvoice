'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Save, Loader2, CheckCircle, ChevronDown, ChevronUp, Mail } from 'lucide-react'

type EmailTemplate = {
  id: string
  name: string
  slug: string
  subject: string
  body_html: string
  body_text: string | null
  variables: string[] | null
  active: boolean
}

function TemplateCard({ tpl, onSave }: {
  tpl: EmailTemplate
  onSave: (updated: EmailTemplate) => void
}) {
  const supabase = createClient()
  const [data, setData] = useState(tpl)
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (key: keyof EmailTemplate, value: string | boolean) => {
    setData(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('email_templates').update({
      subject: data.subject,
      body_html: data.body_html,
      body_text: data.body_text,
      active: data.active,
      updated_at: new Date().toISOString(),
    }).eq('id', data.id)
    setSaving(false)
    setSaved(true)
    onSave(data)
  }

  const toggleActive = async () => {
    const next = !data.active
    await supabase.from('email_templates').update({ active: next }).eq('id', data.id)
    setData(prev => ({ ...prev, active: next }))
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{data.name}</CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">{data.slug}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data.variables && data.variables.length > 0 && (
              <div className="hidden sm:flex gap-1 flex-wrap justify-end">
                {data.variables.map(v => (
                  <Badge key={v} variant="outline" className="font-mono text-xs px-1.5 py-0">
                    {'{{' + v + '}}'}
                  </Badge>
                ))}
              </div>
            )}
            <Switch checked={data.active} onCheckedChange={toggleActive} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {!expanded && (
          <p className="text-xs text-muted-foreground mt-1 ml-12 truncate">{data.subject}</p>
        )}
      </CardHeader>

      {expanded && (
        <>
          <Separator />
          <CardContent className="pt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Subject Line</Label>
              <Input
                value={data.subject}
                onChange={e => set('subject', e.target.value)}
                className="h-9 font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">HTML Body</Label>
              <Textarea
                value={data.body_html}
                onChange={e => set('body_html', e.target.value)}
                rows={8}
                className="font-mono text-xs resize-y"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Plain Text Body (optional)</Label>
              <Textarea
                value={data.body_text ?? ''}
                onChange={e => set('body_text', e.target.value)}
                rows={4}
                className="font-mono text-xs resize-y"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                {saving
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : saved
                    ? <CheckCircle className="h-4 w-4" />
                    : <Save className="h-4 w-4" />
                }
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save Template'}
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}

export function EmailTemplatesClient({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates)

  const handleSave = (updated: EmailTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  return (
    <div className="flex flex-col gap-3">
      {templates.map(tpl => (
        <TemplateCard key={tpl.id} tpl={tpl} onSave={handleSave} />
      ))}
    </div>
  )
}
