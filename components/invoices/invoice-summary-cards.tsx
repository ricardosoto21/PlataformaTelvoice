import { Card, CardContent } from '@/components/ui/card'
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { getInvoiceSummary } from '@/lib/invoice-actions'

interface InvoiceSummaryCardsProps {
  type: 'OUTGOING' | 'INCOMING'
}

export async function InvoiceSummaryCards({ type }: InvoiceSummaryCardsProps) {
  const summary = await getInvoiceSummary(type)

  const cards = [
    {
      label: 'Total Invoices',
      value: summary.total.toString(),
      sub: `${summary.draft} draft, ${summary.sent} sent`,
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Paid',
      value: `$${Number(summary.paidAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${summary.paid} invoice${summary.paid !== 1 ? 's' : ''}`,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Pending',
      value: `$${Number(summary.pendingAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${summary.sent} awaiting payment`,
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: 'Overdue',
      value: `$${Number(summary.overdueAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${summary.overdue} invoice${summary.overdue !== 1 ? 's' : ''}`,
      icon: AlertCircle,
      color: 'text-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              </div>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
