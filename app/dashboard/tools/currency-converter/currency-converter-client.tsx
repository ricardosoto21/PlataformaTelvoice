'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, DollarSign, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CurrencyRecord } from '@/lib/types'

export function CurrencyConverterClient({ currencies }: { currencies: CurrencyRecord[] }) {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState(currencies.find((c) => c.code === 'USD')?.code ?? currencies[0]?.code ?? '')
  const [to, setTo] = useState(currencies.find((c) => c.code === 'EUR')?.code ?? currencies[1]?.code ?? '')

  const fromCurrency = currencies.find((c) => c.code === from)
  const toCurrency = currencies.find((c) => c.code === to)

  const result = useMemo(() => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || !fromCurrency || !toCurrency) return null

    const fromRate = fromCurrency.rate_to_usd ?? 1
    const toRate = toCurrency.rate_to_usd ?? 1

    const inUsd = amt / fromRate
    return inUsd * toRate
  }, [amount, fromCurrency, toCurrency])

  const swapCurrencies = () => {
    setFrom(to)
    setTo(from)
  }

  const formatAmount = (val: number, symbol: string | null) =>
    `${symbol ?? ''}${val.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`

  const rate =
    fromCurrency && toCurrency && fromCurrency.rate_to_usd && toCurrency.rate_to_usd
      ? toCurrency.rate_to_usd / fromCurrency.rate_to_usd
      : null

  return (
    <div className="grid max-w-2xl gap-6">
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Convert Amount</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-xl font-mono font-semibold"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-2 font-mono font-medium">{c.code}</span>
                      <span className="text-sm text-muted-foreground">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" className="mb-0 h-10 w-10" onClick={swapCurrencies} title="Swap currencies">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-2 font-mono font-medium">{c.code}</span>
                      <span className="text-sm text-muted-foreground">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {result !== null && (
            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/50 p-4">
              <div className="text-xs text-muted-foreground">Result</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold tracking-tight">
                  {formatAmount(result, toCurrency?.symbol ?? null)}
                </span>
                <span className="text-lg font-mono text-muted-foreground">{to}</span>
              </div>
              {rate !== null && (
                <div className="mt-1 text-xs text-muted-foreground">
                  1 {from} = {rate.toFixed(6)} {to}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Exchange Rates (relative to USD)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {currencies.map((c) => (
              <div
                key={c.code}
                className={`cursor-pointer rounded-lg border p-2.5 text-sm transition-colors ${
                  c.code === from || c.code === to
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/50 hover:bg-muted/30'
                } flex items-center justify-between`}
                onClick={() => {
                  if (c.code !== from) setTo(c.code)
                }}
              >
                <span className="font-mono font-medium">{c.code}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.rate_to_usd != null ? c.rate_to_usd.toFixed(4) : '-'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
