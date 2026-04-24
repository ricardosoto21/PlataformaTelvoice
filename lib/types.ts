// TelvoiceSMS Platform - Database Types

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER'
export type CustomerType = 'CLIENT' | 'WHOLESALE' | 'RESELLER'
export type Currency =
  | 'USD'
  | 'EUR'
  | 'CLP'
  | 'MXN'
  | 'BRL'
  | 'ARS'
  | 'COP'
  | 'PEN'
  | 'GBP'
export type BindMode = 'TX' | 'RX' | 'TRX'
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  ref_number: string
  type: CustomerType
  name: string
  email: string | null
  phone: string | null
  currency: Currency
  balance: number
  credit_limit: number
  active: boolean
  parent_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  email: string | null
  phone: string | null
  active: boolean
  smpp_host: string | null
  smpp_port: number
  smpp_system_id: string | null
  smpp_password: string | null
  smpp_system_type: string | null
  smpp_bind_mode: BindMode
  smpp_max_connections: number
  smpp_throughput: number
  smpp_ton: number
  smpp_npi: number
  smpp_encoding: string
  smpp_keep_alive_interval: number
  connection_status: ConnectionStatus
  last_connected_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SmppAccount {
  id: string
  customer_id: string
  system_id: string
  password: string
  allowed_ips: string[]
  port: number
  bind_mode: BindMode
  max_connections: number
  throughput: number
  ton: number
  npi: number
  encoding: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerOption {
  id: string
  name: string
  ref_number: string
}

export interface VendorOption {
  id: string
  name: string
}

export interface CurrencyRecord {
  id?: string
  code: Currency | string
  name: string
  symbol: string | null
  rate_to_usd: number | null
  active?: boolean
}

// Form types for creating/updating
export interface CustomerFormData {
  ref_number: string
  type: CustomerType
  name: string
  email?: string
  phone?: string
  currency: Currency
  balance?: number
  credit_limit?: number
  active?: boolean
  parent_id?: string
  notes?: string
}

export interface VendorFormData {
  name: string
  email?: string
  phone?: string
  active?: boolean
  smpp_host?: string
  smpp_port?: number
  smpp_system_id?: string
  smpp_password?: string
  smpp_system_type?: string
  smpp_bind_mode?: BindMode
  smpp_max_connections?: number
  smpp_throughput?: number
  smpp_ton?: number
  smpp_npi?: number
  smpp_encoding?: string
  smpp_keep_alive_interval?: number
  notes?: string
}

export interface SmppAccountFormData {
  customer_id: string
  system_id: string
  password: string
  allowed_ips?: string[]
  port?: number
  bind_mode?: BindMode
  max_connections?: number
  throughput?: number
  ton?: number
  npi?: number
  encoding?: string
  active?: boolean
}

// Phase 2 Types
export type RatePlanType = 'RETAIL' | 'WHOLESALE' | 'TERMINATION'
export type RouteType = 'RETAIL' | 'WHOLESALE'

export interface RatePlan {
  id: string
  name: string
  currency: Currency
  type: RatePlanType
  description: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RatePlanEntry {
  id: string
  rate_plan_id: string
  country: string
  country_code: string | null
  mcc: string
  mnc: string
  operator: string | null
  rate: number
  effective_date: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  name: string
  type: RouteType
  description: string | null
  rate_plan_id: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  rate_plan?: RatePlan | null
}

export interface LcrRule {
  id: string
  mcc: string
  mnc: string
  country: string | null
  operator: string | null
  vendor_id: string
  route_id: string | null
  priority: number
  cost: number | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  vendor?: Vendor
  route?: Route | null
}

export interface LcrExclusion {
  id: string
  mcc: string
  mnc: string
  vendor_id: string
  reason: string | null
  active: boolean
  created_by: string | null
  created_at: string
  vendor?: Vendor
}

export interface LoadDistribution {
  id: string
  customer_id: string
  mcc: string
  mnc: string
  vendor_id: string
  load_percentage: number
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  vendor?: Vendor
}

export interface MccMnc {
  id: string
  mcc: string
  mnc: string
  country: string
  country_code: string | null
  operator: string
  network_type: string | null
  active: boolean
  created_at: string
}

// Phase 2 Form Types
export interface RatePlanFormData {
  name: string
  currency: Currency
  type: RatePlanType
  description?: string
  active?: boolean
}

export interface RatePlanEntryFormData {
  rate_plan_id: string
  country: string
  country_code?: string
  mcc: string
  mnc: string
  operator?: string
  rate: number
  effective_date?: string
  active?: boolean
}

export interface RouteFormData {
  name: string
  type: RouteType
  description?: string
  rate_plan_id?: string
  active?: boolean
}

export interface LcrRuleFormData {
  mcc: string
  mnc: string
  country?: string
  operator?: string
  vendor_id: string
  route_id?: string
  priority?: number
  cost?: number
  active?: boolean
}

export interface LcrExclusionFormData {
  mcc: string
  mnc: string
  vendor_id: string
  reason?: string
  active?: boolean
}

export interface LoadDistributionFormData {
  customer_id: string
  mcc: string
  mnc: string
  vendor_id: string
  load_percentage: number
  active?: boolean
}

// Phase 3 Types
export type BlockListType = 'KEYWORD' | 'NUMBER' | 'SENDER_ID' | 'REGEX'
export type ScopeType = 'GLOBAL' | 'CUSTOMER'
export type SenderIdType = 'ALPHANUMERIC' | 'NUMERIC' | 'SHORTCODE'
export type SenderIdStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING'
export type MatchType = 'EXACT' | 'CONTAINS' | 'REGEX' | 'STARTS_WITH' | 'ENDS_WITH'
export type BlockedDestinationScope = 'GLOBAL' | 'CUSTOMER' | 'VENDOR'

export interface BlockList {
  id: string
  name: string
  type: BlockListType
  scope: ScopeType
  customer_id: string | null
  value: string
  description: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: Customer | null
}

export interface SenderIdRecord {
  id: string
  sender_id: string
  customer_id: string | null
  scope: ScopeType
  type: SenderIdType
  status: SenderIdStatus
  country: string | null
  country_code: string | null
  mcc: string | null
  description: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: Customer | null
}

export interface ContentTranslation {
  id: string
  name: string
  customer_id: string | null
  scope: ScopeType
  match_type: MatchType
  source_text: string
  target_text: string
  case_sensitive: boolean
  active: boolean
  priority: number
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: Customer | null
}

export interface BlockedDestination {
  id: string
  mcc: string
  mnc: string | null
  country: string | null
  operator: string | null
  scope: BlockedDestinationScope
  customer_id: string | null
  vendor_id: string | null
  reason: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: Customer | null
  vendor?: Vendor | null
}

// Phase 3 Form Types
export interface BlockListFormData {
  name: string
  type: BlockListType
  scope: ScopeType
  customer_id?: string
  value: string
  description?: string
  active?: boolean
}

export interface SenderIdFormData {
  sender_id: string
  customer_id?: string
  scope: ScopeType
  type: SenderIdType
  status: SenderIdStatus
  country?: string
  country_code?: string
  mcc?: string
  description?: string
  active?: boolean
}

export interface ContentTranslationFormData {
  name: string
  customer_id?: string
  scope: ScopeType
  match_type: MatchType
  source_text: string
  target_text: string
  case_sensitive?: boolean
  active?: boolean
  priority?: number
  description?: string
}

export interface BlockedDestinationFormData {
  mcc: string
  mnc?: string
  country?: string
  operator?: string
  scope: BlockedDestinationScope
  customer_id?: string
  vendor_id?: string
  reason?: string
  active?: boolean
}

// Reports Module Types
export type MessageStatus = 'PENDING' | 'SUBMITTED' | 'DELIVERED' | 'FAILED' | 'REJECTED' | 'EXPIRED'
export type BalanceTransactionType = 'RECHARGE' | 'DEBIT' | 'ADJUSTMENT' | 'REFUND' | 'INVOICE'
export type ReportType = 'FINANCE' | 'RETAIL' | 'WHOLESALE' | 'VENDOR' | 'CUSTOM'
export type ReportExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Message {
  id: string
  external_id: string | null
  customer_id: string | null
  vendor_id: string | null
  route_id: string | null
  smpp_account_id: string | null
  source_addr: string
  dest_addr: string
  message_text: string | null
  encoding: string
  message_parts: number
  mcc: string | null
  mnc: string | null
  country: string | null
  operator: string | null
  status: MessageStatus
  error_code: string | null
  error_message: string | null
  customer_rate: number
  vendor_rate: number
  profit: number
  currency: string
  submitted_at: string
  sent_at: string | null
  delivered_at: string | null
  dlr_status: string | null
  dlr_received_at: string | null
  created_at: string
  customer?: Customer | null
  vendor?: Vendor | null
}

export interface BalanceTransaction {
  id: string
  customer_id: string
  type: BalanceTransactionType
  amount: number
  currency: string
  description: string | null
  balance_before: number
  balance_after: number
  reference_id: string | null
  payment_method: string | null
  created_by: string | null
  created_at: string
  customer?: Customer
}

export interface ReportExport {
  id: string
  name: string
  type: ReportType
  filters: Record<string, unknown> | null
  file_path: string | null
  file_size: number | null
  status: ReportExportStatus
  created_by: string | null
  created_at: string
  completed_at: string | null
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  customerId?: string
  vendorId?: string
  status?: MessageStatus | 'all'
  country?: string
  mcc?: string
}

export interface ReportSummary {
  totalMessages: number
  delivered: number
  failed: number
  deliveryRate: number
  totalRevenue: number
  totalCost: number
  profit: number
  margin: number
}

// Invoices Module Types
export type InvoiceType = 'OUTGOING' | 'INCOMING'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface Invoice {
  id: string
  invoice_number: string
  type: InvoiceType
  customer_id: string | null
  vendor_id: string | null
  period_start: string
  period_end: string
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax: number
  total: number
  currency: string
  status: InvoiceStatus
  notes: string | null
  pdf_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  paid_at: string | null
  sent_at: string | null
  customer?: (Customer & { company_name?: string | null; address?: string | null; country?: string | null }) | null
  vendor?: (Vendor & { address?: string | null; country?: string | null }) | null
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  mcc: string | null
  mnc: string | null
  country: string | null
  operator: string | null
  created_at: string
}

export interface InvoiceFormData {
  type: InvoiceType
  customer_id?: string
  vendor_id?: string
  period_start: string
  period_end: string
  due_date?: string
  subtotal: number
  tax_rate: number
  tax: number
  total: number
  currency: string
  status: InvoiceStatus
  notes?: string
}

export interface InvoiceItemFormData {
  description: string
  quantity: number
  unit_price: number
  total: number
  mcc?: string
  mnc?: string
  country?: string
  operator?: string
}
