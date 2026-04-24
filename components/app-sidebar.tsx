'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  SidebarSeparator,
} from '@/components/ui/sidebar'
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

const mainNavItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Customers',
    url: '/dashboard/customers',
    icon: Users,
  },
  {
    title: 'Vendors',
    url: '/dashboard/vendors',
    icon: Building2,
  },
  {
    title: 'SMPP Accounts',
    url: '/dashboard/smpp-accounts',
    icon: Server,
  },
]

const routingNavItems = [
  {
    title: 'Rate Plans',
    url: '/dashboard/rate-plans',
    icon: DollarSign,
  },
  {
    title: 'Routes',
    url: '/dashboard/routes',
    icon: Route,
  },
  {
    title: 'LCR Rules',
    url: '/dashboard/lcr',
    icon: GitBranch,
  },
  {
    title: 'Load Distribution',
    url: '/dashboard/load-distribution',
    icon: PieChart,
  },
  {
    title: 'LCR Simulation',
    url: '/dashboard/lcr/simulation',
    icon: FlaskConical,
  },
]

const smppNavItems = [
  {
    title: 'Engine Control',
    url: '/dashboard/smpp',
    icon: Zap,
  },
  {
    title: 'Live Sessions',
    url: '/dashboard/smpp/sessions',
    icon: Activity,
  },
]

const complianceNavItems = [
  {
    title: 'Block Lists',
    url: '/dashboard/block-lists',
    icon: ShieldX,
  },
  {
    title: 'Sender IDs',
    url: '/dashboard/sender-ids',
    icon: AtSign,
  },
  {
    title: 'Content Rules',
    url: '/dashboard/content-translations',
    icon: Languages,
  },
  {
    title: 'Blocked Destinations',
    url: '/dashboard/blocked-destinations',
    icon: Ban,
  },
]

const reportsNavItems = [
  {
    title: 'Finance Report',
    url: '/dashboard/reports/finance',
    icon: TrendingUp,
  },
  {
    title: 'Retail Report',
    url: '/dashboard/reports/retail',
    icon: BarChart3,
  },
  {
    title: 'Wholesale Report',
    url: '/dashboard/reports/wholesale',
    icon: Truck,
  },
  {
    title: 'Vendor Report',
    url: '/dashboard/reports/vendor',
    icon: FileText,
  },
]

const invoicesNavItems = [
  {
    title: 'Outgoing Invoices',
    url: '/dashboard/invoices/outgoing',
    icon: Receipt,
  },
  {
    title: 'Incoming Invoices',
    url: '/dashboard/invoices/incoming',
    icon: FileText,
  },
]

const logsNavItems = [
  {
    title: 'System Logs',
    url: '/dashboard/logs/system',
    icon: ScrollText,
  },
  {
    title: 'Vendor Logs',
    url: '/dashboard/logs/vendor',
    icon: Building2,
  },
  {
    title: 'Customer Logs',
    url: '/dashboard/logs/customer',
    icon: Users,
  },
  {
    title: 'SMPP Logs',
    url: '/dashboard/logs/smpp',
    icon: Radio,
  },
]

const dlrNavItems = [
  {
    title: 'DLR Queue',
    url: '/dashboard/dlr/queue',
    icon: RefreshCw,
  },
  {
    title: 'DLR Overrides',
    url: '/dashboard/dlr/overrides',
    icon: GitBranch,
  },
  {
    title: 'Re-Rate Jobs',
    url: '/dashboard/dlr/re-rate',
    icon: DollarSign,
  },
]

const approvalsNavItems = [
  {
    title: 'Pending Approvals',
    url: '/dashboard/approvals',
    icon: CheckCircle,
  },
  {
    title: 'SMS Templates',
    url: '/dashboard/approvals/templates',
    icon: FileText,
  },
]

const jobsNavItems = [
  {
    title: 'All Jobs',
    url: '/dashboard/jobs',
    icon: BriefcaseBusiness,
  },
]

const hlrNavItems = [
  {
    title: 'Providers',
    url: '/dashboard/hlr/providers',
    icon: Radio,
  },
  {
    title: 'Dip Rules',
    url: '/dashboard/hlr/rules',
    icon: GitBranch,
  },
  {
    title: 'HLR Lookup',
    url: '/dashboard/hlr/lookup',
    icon: Phone,
  },
]

const toolsNavItems = [
  {
    title: 'MCC/MNC Finder',
    url: '/dashboard/tools/mcc-mnc',
    icon: Radio,
  },
  {
    title: 'Message Tester',
    url: '/dashboard/tools/message-tester',
    icon: MessageSquare,
  },
  {
    title: 'Re-Push DLR',
    url: '/dashboard/tools/repush-dlr',
    icon: RefreshCw,
  },
  {
    title: 'Currency Converter',
    url: '/dashboard/tools/currency-converter',
    icon: DollarSign,
  },
  {
    title: 'Error Code Mapper',
    url: '/dashboard/tools/error-codes',
    icon: Wrench,
  },
  {
    title: 'Regex Tester',
    url: '/dashboard/tools/regex-tester',
    icon: ShieldX,
  },
]

const voiceNavItems = [
  {
    title: 'SIP Accounts',
    url: '/dashboard/voice/sip',
    icon: PhoneCall,
  },
  {
    title: 'CDR',
    url: '/dashboard/voice/cdr',
    icon: ScrollText,
  },
  {
    title: 'Voice Rate Plans',
    url: '/dashboard/voice/rate-plans',
    icon: DollarSign,
  },
  {
    title: 'Voice Stats',
    url: '/dashboard/voice/stats',
    icon: BarChart2,
  },
]

const settingsNavItems = [
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'Entity',
    url: '/dashboard/settings/entity',
    icon: Building2,
  },
  {
    title: 'Currencies',
    url: '/dashboard/settings/currencies',
    icon: DollarSign,
  },
  {
    title: 'Countries',
    url: '/dashboard/settings/countries',
    icon: GitBranch,
  },
  {
    title: 'Operators',
    url: '/dashboard/settings/operators',
    icon: Radio,
  },
  {
    title: 'SMTP',
    url: '/dashboard/settings/smtp',
    icon: MessageSquare,
  },
  {
    title: 'Email Templates',
    url: '/dashboard/settings/email-templates',
    icon: FileText,
  },
  {
    title: 'Login Traces',
    url: '/dashboard/settings/login-traces',
    icon: ScrollText,
  },
]

interface AppSidebarProps {
  profile: Profile | null
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Routing & Pricing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routingNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>SMPP Engine</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {smppNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Compliance & Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {complianceNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Invoices</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {invoicesNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Logs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {logsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>DLR Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dlrNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Approvals</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {approvalsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Jobs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {jobsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>HLR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hlrNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Voice</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {voiceNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-0.5 text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {profile?.email || ''}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
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
