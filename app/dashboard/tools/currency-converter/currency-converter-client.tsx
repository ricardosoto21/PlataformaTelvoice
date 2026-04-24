'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftRight, DollarSign, TrendingUp } from 'lucide-react'

type Currency = {
  code: string
  name: string
  symbol: string | null
  rate_to_usd: number | null
}

export function CurrencyConverterClient({ currencies }: { currencies: Currency[] }) {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState(currencies.find(c => c.code === 'USD')?.code ?? currencies[0]?.code ?? '')
  const [to, setTo] = useState(currencies.find(c => c.code === 'EUR')?.code ?? currencies[1]?.code ?? '')

  const fromCurrency = currencies.find(c => c.code === from)
  const toCurrency   = currencies.find(c => c.code === to)

  const result = useMemo(() => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || !fromCurrency || !toCurrency) return null

    const fromRate = fromCurrency.rate_to_usd ?? 1
    const toRate   = toCurrency.rate_to_usd ?? 1

    // Rates are stored as "per 1 USD", so convert: amt / fromRate * toRate
    const inUsd = amt / fromRate
    const converted = inUsd * toRate
    return converted
  }, [amount, fromCurrency, toCurrency])

  const swapCurrencies = () => {
    setFrom(to)
    setTo(from)
  }

  const formatAmount = (val: number, symbol: string | null) =>
    `${symbol ?? ''}${val.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`

  const rate = fromCurrency && toCurrency && fromCurrency.rate_to_usd && toCurrency.rate_to_usd
    ? (toCurrency.rate_to_usd / fromCurrency.rate_to_usd)
    : null

  return (
    <div className="grid gap-6 max-w-2xl">
      {/* Main Converter */}
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
              onChange={e => setAmount(e.target.value)}
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
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono font-medium mr-2">{c.code}</span>
                      <span className="text-muted-foreground text-sm">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 mb-0"
              onClick={swapCurrencies}
              title="Swap currencies"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono font-medium mr-2">{c.code}</span>
                      <span className="text-muted-foreground text-sm">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result */}
          {result !== null && (
            <div className="rounded-lg bg-muted/50 border border-border/50 p-4 flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">Result</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold tracking-tight">
                  {formatAmount(result, toCurrency?.symbol ?? null)}
                </span>
                <span className="text-lg text-muted-foreground font-mono">{to}</span>
              </div>
              {rate !== null && (
                <div className="text-xs text-muted-foreground mt-1">
                  1 {from} = {rate.toFixed(6)} {to}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Exchange Rates (relative to USD)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {currencies.map(c => (
              <div
                key={c.code}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                  c.code === from || c.code === to
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/50 hover:bg-muted/30'
                }`}
                onClick={() => {
                  if (c.code !== from) setTo(c.code)
                }}
              >
                <span className="font-mono font-medium">{c.code}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {c.exchange_rate != null ? c.exchange_rate.toFixed(4) : '—'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
