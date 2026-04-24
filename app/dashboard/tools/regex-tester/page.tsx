'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AlertTriangle, CheckCircle2, XCircle, Plus, Trash2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

type RegexRule = {
  id: string
  pattern: string
  flags: string
  description: string
  action: 'BLOCK' | 'WARN'
}

const DEFAULT_RULES: RegexRule[] = [
  { id: '1', pattern: '(viagra|cialis|porn)',        flags: 'i',  description: 'Adult content keywords',   action: 'BLOCK' },
  { id: '2', pattern: '(win|won|lottery|prize)',      flags: 'i',  description: 'Lottery / prize scam',     action: 'BLOCK' },
  { id: '3', pattern: 'http[s]?://\\S+',              flags: 'gi', description: 'Contains a URL',           action: 'WARN'  },
  { id: '4', pattern: '\\b(\\d{4}[\\s-]?){3}\\d{4}\\b', flags: '', description: 'Credit card number pattern', action: 'BLOCK' },
]

export default function RegexTesterPage() {
  const [rules, setRules] = useState<RegexRule[]>(DEFAULT_RULES)
  const [testText, setTestText] = useState('Congratulations! You won a FREE prize. Click http://spam.com to claim it.')
  const [newPattern, setNewPattern] = useState('')
  const [newFlags, setNewFlags] = useState('i')
  const [newDesc, setNewDesc] = useState('')
  const [newAction, setNewAction] = useState<'BLOCK' | 'WARN'>('BLOCK')
  const [caseSensitive, setCaseSensitive] = useState(false)

  type MatchResult = {
    rule: RegexRule
    matches: RegExpMatchArray[]
    error: string | null
  }

  const results = useMemo<MatchResult[]>(() => {
    return rules.map(rule => {
      try {
        const flags = caseSensitive ? rule.flags.replace('i', '') : rule.flags.includes('i') ? rule.flags : rule.flags + 'i'
        const re = new RegExp(rule.pattern, flags.includes('g') ? flags : flags + 'g')
        const matches: RegExpMatchArray[] = []
        let m: RegExpMatchArray | null
        while ((m = re.exec(testText)) !== null) {
          matches.push(m)
          if (!re.global) break
        }
        return { rule, matches, error: null }
      } catch (e: unknown) {
        return { rule, matches: [], error: e instanceof Error ? e.message : 'Invalid regex' }
      }
    })
  }, [rules, testText, caseSensitive])

  const blockedBy = results.filter(r => r.matches.length > 0 && r.rule.action === 'BLOCK')
  const warnedBy  = results.filter(r => r.matches.length > 0 && r.rule.action === 'WARN')
  const overallStatus = blockedBy.length > 0 ? 'BLOCKED' : warnedBy.length > 0 ? 'WARN' : 'OK'

  const addRule = () => {
    if (!newPattern.trim()) return
    setRules(prev => [...prev, {
      id: Date.now().toString(),
      pattern: newPattern.trim(),
      flags: newFlags,
      description: newDesc,
      action: newAction,
    }])
    setNewPattern('')
    setNewDesc('')
  }

  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id))

  const highlightText = () => {
    let result = testText
    const allPatterns = results.flatMap(r =>
      r.matches.map(m => ({ match: m[0], action: r.rule.action }))
    )
    // Return array of segments
    const segments: { text: string; type: 'normal' | 'block' | 'warn' }[] = []
    let lastIndex = 0
    const sorted = [...allPatterns].sort((a, b) => testText.indexOf(a.match) - testText.indexOf(b.match))
    const seen = new Set<string>()
    for (const { match, action } of sorted) {
      const idx = testText.indexOf(match, lastIndex)
      if (idx === -1 || seen.has(match)) continue
      seen.add(match)
      if (idx > lastIndex) segments.push({ text: testText.slice(lastIndex, idx), type: 'normal' })
      segments.push({ text: match, type: action === 'BLOCK' ? 'block' : 'warn' })
      lastIndex = idx + match.length
    }
    if (lastIndex < testText.length) segments.push({ text: testText.slice(lastIndex), type: 'normal' })
    return segments
  }

  const segments = highlightText()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Block / Regex Tester</h1>
        <p className="text-muted-foreground">Test message content against blocking and warning regex rules</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left: test input + result */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Test Message</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Case sensitive</span>
                  <Switch checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                value={testText}
                onChange={e => setTestText(e.target.value)}
                rows={5}
                placeholder="Enter SMS text to test…"
                className="resize-y font-mono text-sm"
              />

              {/* Highlighted preview */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm font-mono leading-relaxed min-h-12 break-words">
                {segments.length === 0
                  ? <span className="text-muted-foreground">Preview will appear here…</span>
                  : segments.map((seg, i) =>
                      seg.type === 'normal'
                        ? <span key={i}>{seg.text}</span>
                        : seg.type === 'block'
                          ? <mark key={i} className="bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded px-0.5">{seg.text}</mark>
                          : <mark key={i} className="bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded px-0.5">{seg.text}</mark>
                    )
                }
              </div>

              {/* Verdict */}
              <div className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                overallStatus === 'BLOCKED' ? 'border-rose-500/30 bg-rose-500/5' :
                overallStatus === 'WARN'    ? 'border-amber-500/30 bg-amber-500/5' :
                                              'border-emerald-500/30 bg-emerald-500/5'
              )}>
                {overallStatus === 'BLOCKED'
                  ? <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  : overallStatus === 'WARN'
                    ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    : <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                }
                <div>
                  <p className="text-sm font-semibold">
                    {overallStatus === 'BLOCKED' ? 'Message would be BLOCKED' :
                     overallStatus === 'WARN'    ? 'Message triggers WARNINGS' :
                                                   'Message passes all rules'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {blockedBy.length > 0 && `Blocked by: ${blockedBy.map(r => r.rule.description || r.rule.pattern).join(', ')}. `}
                    {warnedBy.length  > 0 && `Warned by: ${warnedBy.map(r => r.rule.description || r.rule.pattern).join(', ')}.`}
                    {overallStatus === 'OK' && 'No rule matched.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: rules */}
        <div className="flex flex-col gap-4">
          {/* Rule list */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Rules ({rules.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {rules.map(rule => {
                const res = results.find(r => r.rule.id === rule.id)
                const hit = (res?.matches.length ?? 0) > 0
                return (
                  <div key={rule.id} className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    hit && rule.action === 'BLOCK' ? 'border-rose-500/40 bg-rose-500/5' :
                    hit && rule.action === 'WARN'  ? 'border-amber-500/40 bg-amber-500/5' :
                    'border-border/50'
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">{rule.pattern}</code>
                        {rule.flags && <span className="text-xs text-muted-foreground font-mono">/{rule.flags}</span>}
                        <Badge
                          variant="outline"
                          className={rule.action === 'BLOCK'
                            ? 'text-xs bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'text-xs bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }
                        >
                          {rule.action}
                        </Badge>
                        {hit && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {res!.matches.length} match{res!.matches.length !== 1 ? 'es' : ''}
                          </Badge>
                        )}
                        {res?.error && (
                          <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-600 border-rose-500/20">
                            Invalid
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRule(rule.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Add new rule */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Add Rule</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Regex Pattern</Label>
                  <Input
                    value={newPattern}
                    onChange={e => setNewPattern(e.target.value)}
                    placeholder="e.g. (spam|phishing)"
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div className="w-20 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Flags</Label>
                  <Input
                    value={newFlags}
                    onChange={e => setNewFlags(e.target.value)}
                    placeholder="gi"
                    className="h-9 font-mono text-sm"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Description (optional)</Label>
                  <Input
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="What does this rule block?"
                    className="h-9"
                  />
                </div>
                <div className="flex gap-2">
                  {(['BLOCK', 'WARN'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setNewAction(a)}
                      className={cn(
                        'h-9 px-3 text-xs rounded-md border transition-colors font-medium',
                        newAction === a
                          ? a === 'BLOCK'
                            ? 'border-rose-500/50 bg-rose-500/10 text-rose-600'
                            : 'border-amber-500/50 bg-amber-500/10 text-amber-600'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={addRule} disabled={!newPattern.trim()} className="gap-2 self-end" size="sm">
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
