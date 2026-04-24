'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  vendors: 'Vendors',
  'smpp-accounts': 'SMPP Accounts',
  'rate-plans': 'Rate Plans',
  routes: 'Routes',
  lcr: 'LCR Rules',
  simulation: 'LCR Simulation',
  'load-distribution': 'Load Distribution',
  smpp: 'Engine Control',
  sessions: 'Live Sessions',
  'block-lists': 'Block Lists',
  'sender-ids': 'Sender IDs',
  'content-translations': 'Content Rules',
  'blocked-destinations': 'Blocked Destinations',
  reports: 'Reports',
  finance: 'Finance Report',
  retail: 'Retail Report',
  wholesale: 'Wholesale Report',
  vendor: 'Vendor Report',
  invoices: 'Invoices',
  outgoing: 'Outgoing Invoices',
  incoming: 'Incoming Invoices',
  logs: 'Logs',
  system: 'System Logs',
  customer: 'Customer Logs',
  dlr: 'DLR Management',
  queue: 'DLR Queue',
  overrides: 'DLR Overrides',
  're-rate': 'Re-Rate Jobs',
  approvals: 'Approvals',
  templates: 'SMS Templates',
  jobs: 'All Jobs',
  hlr: 'HLR',
  providers: 'Providers',
  rules: 'Dip Rules',
  lookup: 'HLR Lookup',
  voice: 'Voice',
  sip: 'SIP Accounts',
  cdr: 'CDR',
  stats: 'Voice Stats',
  tools: 'Tools',
  'mcc-mnc': 'MCC/MNC Finder',
  'message-tester': 'Message Tester',
  'repush-dlr': 'Re-Push DLR',
  'currency-converter': 'Currency Converter',
  'error-codes': 'Error Code Mapper',
  'regex-tester': 'Regex Tester',
  settings: 'Settings',
  entity: 'Entity',
  currencies: 'Currencies',
  countries: 'Countries',
  operators: 'Operators',
  smtp: 'SMTP',
  'email-templates': 'Email Templates',
  'login-traces': 'Login Traces',
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = '/' + segments.slice(0, index + 1).join('/')
          const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
