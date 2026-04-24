'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Building2,
  Server,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  DollarSign,
  Route,
  GitBranch,
  PieChart,
  ShieldX,
  AtSign,
  Languages,
  Ban,
  BarChart3,
  FileText,
  TrendingUp,
  Truck,
  Receipt,
  Zap,
  Activity,
  ScrollText,
  RefreshCw,
  CheckCircle,
  BriefcaseBusiness,
  Phone,
  PhoneCall,
  Wrench,
  Radio,
  FlaskConical,
  BarChart2,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOut } from '@/lib/auth-actions'
import type { Profile } from '@/lib/types'

type NavItem = {
  title: string
  url: string
  icon: React.ElementType
}

type NavSection = {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    defaultOpen: true,
    items: [
      { title: 'Dashboard',    url: '/dashboard',            icon: LayoutDashboard },
      { title: 'Customers',    url: '/dashboard/customers',  icon: Users },
      { title: 'Vendors',      url: '/dashboard/vendors',    icon: Building2 },
      { title: 'SMPP Accounts',url: '/dashboard/smpp-accounts', icon: Server },
    ],
  },
  {
    label: 'Routing & Pricing',
    defaultOpen: false,
    items: [
      { title: 'Rate Plans',       url: '/dashboard/rate-plans',       icon: DollarSign },
      { title: 'Routes',           url: '/dashboard/routes',           icon: Route },
      { title: 'LCR Rules',        url: '/dashboard/lcr',              icon: GitBranch },
      { title: 'Load Distribution',url: '/dashboard/load-distribution',icon: PieChart },
      { title: 'LCR Simulation',   url: '/dashboard/lcr/simulation',   icon: FlaskConical },
    ],
  },
  {
    label: 'SMPP Engine',
    defaultOpen: false,
    items: [
      { title: 'Engine Control', url: '/dashboard/smpp',          icon: Zap },
      { title: 'Live Sessions',  url: '/dashboard/smpp/sessions', icon: Activity },
    ],
  },
  {
    label: 'Compliance & Control',
    defaultOpen: false,
    items: [
      { title: 'Block Lists',         url: '/dashboard/block-lists',          icon: ShieldX },
      { title: 'Sender IDs',          url: '/dashboard/sender-ids',           icon: AtSign },
      { title: 'Content Rules',       url: '/dashboard/content-translations', icon: Languages },
      { title: 'Blocked Destinations',url: '/dashboard/blocked-destinations', icon: Ban },
    ],
  },
  {
    label: 'Reports',
    defaultOpen: false,
    items: [
      { title: 'Finance Report',   url: '/dashboard/reports/finance',   icon: TrendingUp },
      { title: 'Retail Report',    url: '/dashboard/reports/retail',    icon: BarChart3 },
      { title: 'Wholesale Report', url: '/dashboard/reports/wholesale', icon: Truck },
      { title: 'Vendor Report',    url: '/dashboard/reports/vendor',    icon: FileText },
    ],
  },
  {
    label: 'Invoices',
    defaultOpen: false,
    items: [
      { title: 'Outgoing Invoices', url: '/dashboard/invoices/outgoing', icon: Receipt },
      { title: 'Incoming Invoices', url: '/dashboard/invoices/incoming', icon: FileText },
    ],
  },
  {
    label: 'Logs',
    defaultOpen: false,
    items: [
      { title: 'System Logs',   url: '/dashboard/logs/system',   icon: ScrollText },
      { title: 'Vendor Logs',   url: '/dashboard/logs/vendor',   icon: Building2 },
      { title: 'Customer Logs', url: '/dashboard/logs/customer', icon: Users },
      { title: 'SMPP Logs',     url: '/dashboard/logs/smpp',     icon: Radio },
    ],
  },
  {
    label: 'DLR Management',
    defaultOpen: false,
    items: [
      { title: 'DLR Queue',    url: '/dashboard/dlr/queue',     icon: RefreshCw },
      { title: 'DLR Overrides',url: '/dashboard/dlr/overrides', icon: GitBranch },
      { title: 'Re-Rate Jobs', url: '/dashboard/dlr/re-rate',   icon: DollarSign },
    ],
  },
  {
    label: 'Approvals',
    defaultOpen: false,
    items: [
      { title: 'Pending Approvals', url: '/dashboard/approvals',           icon: CheckCircle },
      { title: 'SMS Templates',     url: '/dashboard/approvals/templates', icon: FileText },
    ],
  },
  {
    label: 'Jobs',
    defaultOpen: false,
    items: [
      { title: 'All Jobs', url: '/dashboard/jobs', icon: BriefcaseBusiness },
    ],
  },
  {
    label: 'HLR',
    defaultOpen: false,
    items: [
      { title: 'Providers',   url: '/dashboard/hlr/providers', icon: Radio },
      { title: 'Dip Rules',   url: '/dashboard/hlr/rules',     icon: GitBranch },
      { title: 'HLR Lookup',  url: '/dashboard/hlr/lookup',    icon: Phone },
    ],
  },
  {
    label: 'Voice',
    defaultOpen: false,
    items: [
      { title: 'SIP Accounts',    url: '/dashboard/voice/sip',        icon: PhoneCall },
      { title: 'CDR',             url: '/dashboard/voice/cdr',        icon: ScrollText },
      { title: 'Voice Rate Plans',url: '/dashboard/voice/rate-plans', icon: DollarSign },
      { title: 'Voice Stats',     url: '/dashboard/voice/stats',      icon: BarChart2 },
    ],
  },
  {
    label: 'Tools',
    defaultOpen: false,
    items: [
      { title: 'MCC/MNC Finder',    url: '/dashboard/tools/mcc-mnc',            icon: Radio },
      { title: 'Message Tester',    url: '/dashboard/tools/message-tester',     icon: MessageSquare },
      { title: 'Re-Push DLR',       url: '/dashboard/tools/repush-dlr',         icon: RefreshCw },
      { title: 'Currency Converter',url: '/dashboard/tools/currency-converter', icon: DollarSign },
      { title: 'Error Code Mapper', url: '/dashboard/tools/error-codes',        icon: Wrench },
      { title: 'Regex Tester',      url: '/dashboard/tools/regex-tester',       icon: ShieldX },
    ],
  },
  {
    label: 'System',
    defaultOpen: false,
    items: [
      { title: 'Settings',        url: '/dashboard/settings',                icon: Settings },
      { title: 'Entity',          url: '/dashboard/settings/entity',         icon: Building2 },
      { title: 'Currencies',      url: '/dashboard/settings/currencies',     icon: DollarSign },
      { title: 'Countries',       url: '/dashboard/settings/countries',      icon: GitBranch },
      { title: 'Operators',       url: '/dashboard/settings/operators',      icon: Radio },
      { title: 'SMTP',            url: '/dashboard/settings/smtp',           icon: MessageSquare },
      { title: 'Email Templates', url: '/dashboard/settings/email-templates',icon: FileText },
      { title: 'Login Traces',    url: '/dashboard/settings/login-traces',   icon: ScrollText },
    ],
  },
]

interface AppSidebarProps {
  profile: Profile | null
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()

  // Determine which sections have an active route so they open by default
  const initialOpen = navSections.reduce<Record<string, boolean>>((acc, section) => {
    const hasActive = section.items.some(
      (item) => pathname === item.url || pathname.startsWith(item.url + '/')
    )
    acc[section.label] = hasActive || (section.defaultOpen ?? false)
    return acc
  }, {})

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpen)

  const toggle = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TelvoiceSMS</span>
                  <span className="text-xs text-muted-foreground">Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {navSections.map((section) => {
          const isOpen = openSections[section.label] ?? false
          const hasActive = section.items.some(
            (item) => pathname === item.url || pathname.startsWith(item.url + '/')
          )

          return (
            <Collapsible
              key={section.label}
              open={isOpen}
              onOpenChange={() => toggle(section.label)}
            >
              <SidebarGroup className="py-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel
                    className="flex cursor-pointer select-none items-center justify-between rounded-md px-2 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group/label"
                  >
                    <span className={hasActive ? 'text-sidebar-foreground' : ''}>{section.label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const active =
                          pathname === item.url || pathname.startsWith(item.url + '/')
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={item.title}
                            >
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-0.5 text-left leading-tight min-w-0">
                    <span className="truncate text-sm font-medium">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {profile?.email || ''}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
