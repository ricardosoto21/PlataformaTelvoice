'use client'

import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

// Mapping de rutas a etiquetas legibles
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'customers': 'Customers',
  'vendors': 'Vendors',
  'smpp': 'SMPP Engine',
  'sessions': 'Live Sessions',
  'reports': 'Reports',
  'finance': 'Finance Report',
  'retail': 'Retail Report',
  'vendor': 'Vendor Report',
  'wholesale': 'Wholesale Report',
  'voice': 'Voice',
  'sip': 'SIP Accounts',
  'cdr': 'Call History',
  'stats': 'Voice Statistics',
  'rate-plans': 'Voice Rate Plans',
  'dlr': 'DLR',
  'queue': 'DLR Queue',
  'logs': 'Logs',
  'system': 'System Logs',
  'sms': 'SMS Logs',
  'content': 'Content',
  'translations': 'Translations',
  'rules': 'Block Rules',
  'sender-ids': 'Sender IDs',
  'invoices': 'Invoices',
  'outgoing': 'Outgoing',
  'incoming': 'Incoming',
  'settings': 'Settings',
  'entity': 'Entity',
  'currencies': 'Currencies',
  'countries': 'Countries',
  'operators': 'Network Operators',
  'email-templates': 'Email Templates',
  'smtp': 'SMTP Config',
  'login-traces': 'Login Traces',
  'system': 'System Settings',
  'tools': 'Tools',
  'mcc-mnc': 'MCC/MNC Finder',
  'message-tester': 'Message Tester',
  'repush-dlr': 'Re-Push DLR',
  'currency-converter': 'Currency Converter',
  'error-codes': 'Error Code Mapper',
  'regex-tester': 'Regex Tester',
  'lcr': 'LCR',
  'simulation': 'LCR Simulation',
  'load-distribution': 'Load Distribution',
  'blocked-destinations': 'Blocked Destinations',
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  // Extrae el último segmento significativo de la ruta
  const segments = pathname.split('/').filter(Boolean)
  
  // Obtén la última parte (excluyendo /dashboard)
  let label = 'Dashboard'
  
  if (segments.length > 1) {
    // Busca el última segmento en routeLabels, o usa el anterior
    const lastSegment = segments[segments.length - 1]
    const secondLastSegment = segments[segments.length - 2]
    
    // Prioridad: último segmento → segundo último → combina ambos
    label = 
      routeLabels[lastSegment] ??
      routeLabels[secondLastSegment] ??
      lastSegment.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
