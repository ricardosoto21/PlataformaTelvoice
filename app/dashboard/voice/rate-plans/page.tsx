'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VoiceRatePlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [openPlan, setOpenPlan] = useState(false)
  const [openRate, setOpenRate] = useState(false)
  const [planForm, setPlanForm] = useState({ name: '', currency: 'USD', billing_increment: '6', min_duration: '6' })
  const [rateForm, setRateForm] = useState({ country: '', prefix: '', rate_per_min: '0', connection_fee: '0' })
  const supabase = createClient()

  async function loadPlans() {
    const { data } = await supabase.from('voice_rate_plans').select('*').order('name')
    setPlans(data ?? [])
    if (!selectedPlan && data?.length) setSelectedPlan(data[0].id)
  }

  async function loadRates(planId: string) {
    const { data } = await supabase.from('voice_rates').select('*').eq('rate_plan_id', planId).order('country').order('prefix')
    setRates(data ?? [])
  }

  useEffect(() => { loadPlans() }, [])
  useEffect(() => { if (selectedPlan) loadRates(selectedPlan) }, [selectedPlan])

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('voice_rate_plans').insert({
      name: planForm.name, currency: planForm.currency,
      billing_increment: parseInt(planForm.billing_increment),
      min_duration: parseInt(planForm.min_duration),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Voice rate plan created')
    setOpenPlan(false)
    setPlanForm({ name: '', currency: 'USD', billing_increment: '6', min_duration: '6' })
    loadPlans()
  }

  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('voice_rates').insert({
      rate_plan_id: selectedPlan,
      country: rateForm.country,
      prefix: rateForm.prefix,
      rate_per_min: parseFloat(rateForm.rate_per_min),
      connection_fee: parseFloat(rateForm.connection_fee),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Rate added')
    setOpenRate(false)
    setRateForm({ country: '', prefix: '', rate_per_min: '0', connection_fee: '0' })
    loadRates(selectedPlan)
  }

  async function togglePlan(id: string, active: boolean) {
    await supabase.from('voice_rate_plans').update({ active }).eq('id', id)
    loadPlans()
  }

  async function deleteRate(id: string) {
    await supabase.from('voice_rates').delete().eq('id', id)
    toast.success('Rate deleted')
    loadRates(selectedPlan)
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Voice Rate Plans</h1>
          <p className="text-muted-foreground">Manage per-minute voice rates by destination</p>
        </div>
        <Dialog open={openPlan} onOpenChange={setOpenPlan}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Rate Plan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Create Voice Rate Plan</DialogTitle></DialogHeader>
            <form onSubmit={handleCreatePlan} className="flex flex-col gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Plan Name *</Label>
                <Input required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="US & Canada Flat" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={planForm.currency} onValueChange={(v) => setPlanForm({ ...planForm, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['USD','EUR','GBP'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Bill. Inc. (s)</Label>
                  <Input type="number" min={1} value={planForm.billing_increment} onChange={(e) => setPlanForm({ ...planForm, billing_increment: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Min. Dur. (s)</Label>
                  <Input type="number" min={1} value={planForm.min_duration} onChange={(e) => setPlanForm({ ...planForm, min_duration: e.target.value })} />
                </div>
              </div>
              <Button type="submit">Create Plan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedPlan} onValueChange={setSelectedPlan}>
        <div className="flex items-center justify-between">
          <TabsList className="h-auto flex-wrap">
            {plans.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="text-xs">{p.name}</TabsTrigger>
            ))}
          </TabsList>
            <div className="flex items-center gap-3">
              {selectedPlanData && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedPlanData.billing_increment}s/{selectedPlanData.min_duration}s</span>
                  <Switch checked={selectedPlanData.active} onCheckedChange={(v) => togglePlan(selectedPlanData.id, v)} />
                </div>
              )}
              <Dialog open={openRate} onOpenChange={setOpenRate}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-3.5 w-3.5" />Add Rate</Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Add Voice Rate</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddRate} className="flex flex-col gap-4 pt-2">
                    <div className="grid gap-2">
                      <Label>Country *</Label>
                      <Input required value={rateForm.country} onChange={(e) => setRateForm({ ...rateForm, country: e.target.value })} placeholder="United States" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Prefix *</Label>
                      <Input required className="font-mono" value={rateForm.prefix} onChange={(e) => setRateForm({ ...rateForm, prefix: e.target.value })} placeholder="1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Rate/min</Label>
                        <Input type="number" step="0.000001" value={rateForm.rate_per_min} onChange={(e) => setRateForm({ ...rateForm, rate_per_min: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Connection Fee</Label>
                        <Input type="number" step="0.000001" value={rateForm.connection_fee} onChange={(e) => setRateForm({ ...rateForm, connection_fee: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit">Add Rate</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {plans.map((p) => (
          <TabsContent key={p.id} value={p.id}>
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription>{rates.length} destinations · {p.currency} · {p.billing_increment}s billing</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Country</TableHead>
                      <TableHead className="w-24">Prefix</TableHead>
                      <TableHead className="w-32">Rate/min</TableHead>
                      <TableHead className="w-32">Conn. Fee</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!rates.length ? (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No rates added</TableCell></TableRow>
                    ) : (
                      rates.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.country}</TableCell>
                          <TableCell className="font-mono text-sm">+{r.prefix}</TableCell>
                          <TableCell className="font-mono text-sm">${Number(r.rate_per_min).toFixed(6)}</TableCell>
                          <TableCell className="font-mono text-sm">${Number(r.connection_fee).toFixed(6)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRate(r.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {!plans.length && (
          <Card className="border-border/50 mt-4">
            <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
              No voice rate plans yet
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  )
}
