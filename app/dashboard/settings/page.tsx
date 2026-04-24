import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User, Shield, Globe, DollarSign, Mail, Radio, Network,
  FileText, History, Settings2, ChevronRight
} from 'lucide-react'

const settingsSections = [
  {
    title: 'System Settings',
    description: 'Platform name, timezone, traffic limits',
    icon: Settings2,
    href: '/dashboard/settings/system',
    badge: null,
  },
  {
    title: 'Entity Settings',
    description: 'Company legal info, address, banking',
    icon: Shield,
    href: '/dashboard/settings/entity',
    badge: null,
  },
  {
    title: 'Currency Settings',
    description: 'Supported currencies and exchange rates',
    icon: DollarSign,
    href: '/dashboard/settings/currencies',
    badge: null,
  },
  {
    title: 'Country Settings',
    description: 'Enabled/disabled countries with MCC',
    icon: Globe,
    href: '/dashboard/settings/countries',
    badge: null,
  },
  {
    title: 'Network Operators',
    description: 'MCC/MNC prefix database',
    icon: Network,
    href: '/dashboard/settings/operators',
    badge: null,
  },
  {
    title: 'SMTP Manager',
    description: 'Outgoing mail server configuration',
    icon: Mail,
    href: '/dashboard/settings/smtp',
    badge: null,
  },
  {
    title: 'Email Templates',
    description: 'Notification templates with dynamic variables',
    icon: FileText,
    href: '/dashboard/settings/email-templates',
    badge: null,
  },
  {
    title: 'Login Traces',
    description: 'User access history and failed login alerts',
    icon: History,
    href: '/dashboard/settings/login-traces',
    badge: null,
  },
]

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .single()

  const engineStatus = 'Running'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Platform configuration, currencies, operators, SMTP, and access traces
        </p>
      </div>

      {/* Profile card */}
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
              { label: 'Name', value: profile?.full_name || user?.user_metadata?.full_name || '—' },
              { label: 'Email', value: profile?.email || user?.email || '—' },
              { label: 'Role', value: profile?.role || 'USER', isBadge: true },
              { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {item.isBadge
                  ? <Badge variant="outline" className="w-fit">{item.value}</Badge>
                  : <span className="text-sm font-medium">{item.value}</span>
                }
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings sections grid */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Configuration Sections</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {settingsSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{section.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{section.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform status card */}
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
            {[
              { label: 'Platform Version', value: '1.0.0', badge: false },
              { label: 'Environment', value: 'Production', badge: true, variant: 'outline' as const },
              { label: 'Database', value: 'Connected', badge: true, variant: 'default' as const },
              { label: 'SMPP Engine', value: engineStatus, badge: true, variant: (engineStatus === 'Running' ? 'default' : 'secondary') as const },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {item.badge
                  ? <Badge variant={item.variant} className={item.variant === 'default' ? 'w-fit bg-primary/10 text-primary border-primary/20' : 'w-fit'}>{item.value}</Badge>
                  : <span className="text-sm font-medium">{item.value}</span>
                }
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
