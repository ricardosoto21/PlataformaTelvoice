import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronRight,
  DollarSign,
  FileText,
  Globe,
  History,
  Mail,
  Network,
  Radio,
  Settings2,
  Shield,
  User,
} from 'lucide-react'

const settingsSections = [
  {
    title: 'System Settings',
    description: 'Platform name, timezone, traffic limits',
    icon: Settings2,
    href: '/dashboard/settings/system',
  },
  {
    title: 'Entity Settings',
    description: 'Company legal info, address, banking',
    icon: Shield,
    href: '/dashboard/settings/entity',
  },
  {
    title: 'Currency Settings',
    description: 'Supported currencies and exchange rates',
    icon: DollarSign,
    href: '/dashboard/settings/currencies',
  },
  {
    title: 'Country Settings',
    description: 'Enabled/disabled countries with MCC',
    icon: Globe,
    href: '/dashboard/settings/countries',
  },
  {
    title: 'Network Operators',
    description: 'MCC/MNC prefix database',
    icon: Network,
    href: '/dashboard/settings/operators',
  },
  {
    title: 'SMTP Manager',
    description: 'Outgoing mail server configuration',
    icon: Mail,
    href: '/dashboard/settings/smtp',
  },
  {
    title: 'Email Templates',
    description: 'Notification templates with dynamic variables',
    icon: FileText,
    href: '/dashboard/settings/email-templates',
  },
  {
    title: 'Login Traces',
    description: 'User access history and failed login alerts',
    icon: History,
    href: '/dashboard/settings/login-traces',
  },
] as const

type StatusCard = {
  label: string
  value: string
  badge: boolean
  variant?: 'default' | 'outline' | 'secondary'
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  const engineStatus = 'Running'
  const statusCards: StatusCard[] = [
    { label: 'Platform Version', value: '1.0.0', badge: false },
    { label: 'Environment', value: 'Production', badge: true, variant: 'outline' },
    { label: 'Database', value: 'Connected', badge: true, variant: 'default' },
    {
      label: 'SMPP Engine',
      value: engineStatus,
      badge: true,
      variant: engineStatus === 'Running' ? 'default' : 'secondary',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration, currencies, operators, SMTP, and access traces
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Name', value: profile?.full_name || user?.user_metadata?.full_name || '-' },
              { label: 'Email', value: profile?.email || user?.email || '-' },
              { label: 'Role', value: profile?.role || 'USER', isBadge: true },
              {
                label: 'Member since',
                value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-',
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {item.isBadge ? (
                  <Badge variant="outline" className="w-fit">
                    {item.value}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Configuration Sections
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {settingsSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="h-full cursor-pointer border-border/50 transition-all hover:border-primary/40 hover:bg-muted/30">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{section.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{section.description}</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Platform Status</CardTitle>
              <CardDescription>Runtime environment information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statusCards.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {item.badge ? (
                  <Badge
                    variant={item.variant}
                    className={item.variant === 'default' ? 'w-fit border-primary/20 bg-primary/10 text-primary' : 'w-fit'}
                  >
                    {item.value}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
