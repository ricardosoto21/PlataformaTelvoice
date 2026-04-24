'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react'

type ErrorCode = {
  code: string
  hex: string
  name: string
  description: string
  category: 'SUCCESS' | 'TEMP_ERROR' | 'PERM_ERROR' | 'VENDOR'
  retryable: boolean
}

const SMPP_ERROR_CODES: ErrorCode[] = [
  { code: '0x00000000', hex: '00', name: 'ESME_ROK',              description: 'No error — message accepted successfully.',                  category: 'SUCCESS',    retryable: false },
  { code: '0x00000001', hex: '01', name: 'ESME_RINVMSGLEN',       description: 'Message length is invalid.',                                  category: 'PERM_ERROR', retryable: false },
  { code: '0x00000002', hex: '02', name: 'ESME_RINVCMDLEN',       description: 'Command length is invalid.',                                  category: 'PERM_ERROR', retryable: false },
  { code: '0x00000003', hex: '03', name: 'ESME_RINVCMDID',        description: 'Invalid command ID.',                                         category: 'PERM_ERROR', retryable: false },
  { code: '0x00000004', hex: '04', name: 'ESME_RINVBNDSTS',       description: 'Incorrect bind status for this PDU.',                         category: 'TEMP_ERROR', retryable: true  },
  { code: '0x00000005', hex: '05', name: 'ESME_RALYBND',          description: 'ESME is already in bound state.',                             category: 'TEMP_ERROR', retryable: false },
  { code: '0x00000006', hex: '06', name: 'ESME_RINVPRTFLG',       description: 'Invalid priority flag.',                                      category: 'PERM_ERROR', retryable: false },
  { code: '0x00000007', hex: '07', name: 'ESME_RINVREGDLVFLG',    description: 'Invalid registered delivery flag.',                           category: 'PERM_ERROR', retryable: false },
  { code: '0x00000008', hex: '08', name: 'ESME_RSYSERR',          description: 'System error on SMSC side.',                                  category: 'TEMP_ERROR', retryable: true  },
  { code: '0x0000000A', hex: '0A', name: 'ESME_RINVSRCADR',       description: 'Invalid source address.',                                     category: 'PERM_ERROR', retryable: false },
  { code: '0x0000000B', hex: '0B', name: 'ESME_RINVDSTADR',       description: 'Invalid destination address.',                                category: 'PERM_ERROR', retryable: false },
  { code: '0x0000000C', hex: '0C', name: 'ESME_RINVMSGID',        description: 'Message ID is invalid.',                                      category: 'PERM_ERROR', retryable: false },
  { code: '0x0000000D', hex: '0D', name: 'ESME_RBINDFAIL',        description: 'Bind failed — check credentials.',                            category: 'PERM_ERROR', retryable: false },
  { code: '0x0000000E', hex: '0E', name: 'ESME_RINVPASWD',        description: 'Invalid password.',                                           category: 'PERM_ERROR', retryable: false },
  { code: '0x0000000F', hex: '0F', name: 'ESME_RINVSYSID',        description: 'Invalid system ID.',                                          category: 'PERM_ERROR', retryable: false },
  { code: '0x00000011', hex: '11', name: 'ESME_RCANCELFAIL',      description: 'Cancel SM failed.',                                           category: 'TEMP_ERROR', retryable: false },
  { code: '0x00000013', hex: '13', name: 'ESME_RREPLACEFAIL',     description: 'Replace SM failed.',                                          category: 'TEMP_ERROR', retryable: false },
  { code: '0x00000014', hex: '14', name: 'ESME_RMSGQFUL',         description: 'Message queue full — throttle and retry.',                    category: 'TEMP_ERROR', retryable: true  },
  { code: '0x00000015', hex: '15', name: 'ESME_RINVSERTYP',       description: 'Invalid service type.',                                       category: 'PERM_ERROR', retryable: false },
  { code: '0x00000033', hex: '33', name: 'ESME_RINVNUMDESTS',     description: 'Invalid number of destinations.',                             category: 'PERM_ERROR', retryable: false },
  { code: '0x00000034', hex: '34', name: 'ESME_RINVDLNAME',       description: 'Invalid distribution list name.',                             category: 'PERM_ERROR', retryable: false },
  { code: '0x00000040', hex: '40', name: 'ESME_RINVDESTFLAG',     description: 'Invalid destination flag.',                                   category: 'PERM_ERROR', retryable: false },
  { code: '0x00000042', hex: '42', name: 'ESME_RINVSUBREP',       description: 'Invalid submit with replace request.',                        category: 'PERM_ERROR', retryable: false },
  { code: '0x00000043', hex: '43', name: 'ESME_RINVESMCLASS',     description: 'Invalid ESM class field.',                                    category: 'PERM_ERROR', retryable: false },
  { code: '0x00000044', hex: '44', name: 'ESME_RCNTSUBDL',        description: 'Cannot submit to distribution list.',                         category: 'PERM_ERROR', retryable: false },
  { code: '0x00000045', hex: '45', name: 'ESME_RSUBMITFAIL',      description: 'Submit SM failed — generic error.',                           category: 'TEMP_ERROR', retryable: true  },
  { code: '0x00000048', hex: '48', name: 'ESME_RINVSRCTON',       description: 'Invalid source address TON.',                                 category: 'PERM_ERROR', retryable: false },
  { code: '0x00000049', hex: '49', name: 'ESME_RINVSRCNPI',       description: 'Invalid source address NPI.',                                 category: 'PERM_ERROR', retryable: false },
  { code: '0x00000050', hex: '50', name: 'ESME_RINVDSTTON',       description: 'Invalid destination TON.',                                    category: 'PERM_ERROR', retryable: false },
  { code: '0x00000051', hex: '51', name: 'ESME_RINVDSTNPI',       description: 'Invalid destination NPI.',                                    category: 'PERM_ERROR', retryable: false },
  { code: '0x00000053', hex: '53', name: 'ESME_RINVSYSTYP',       description: 'Invalid system type field.',                                  category: 'PERM_ERROR', retryable: false },
  { code: '0x00000054', hex: '54', name: 'ESME_RINVREPFLAG',      description: 'Invalid replace-if-present flag.',                            category: 'PERM_ERROR', retryable: false },
  { code: '0x00000055', hex: '55', name: 'ESME_RINVNUMMSGS',      description: 'Invalid number of messages.',                                 category: 'PERM_ERROR', retryable: false },
  { code: '0x00000058', hex: '58', name: 'ESME_RTHROTTLED',       description: 'Throttling error — reduce TPS.',                              category: 'TEMP_ERROR', retryable: true  },
  { code: '0x00000061', hex: '61', name: 'ESME_RINVSCHED',        description: 'Invalid scheduled delivery time.',                            category: 'PERM_ERROR', retryable: false },
  { code: '0x00000062', hex: '62', name: 'ESME_RINVEXPIRY',       description: 'Invalid message validity period.',                            category: 'PERM_ERROR', retryable: false },
  { code: '0x00000063', hex: '63', name: 'ESME_RINVDFTMSGID',     description: 'Predefined message invalid or not found.',                    category: 'PERM_ERROR', retryable: false },
  { code: '0x00000064', hex: '64', name: 'ESME_RX_T_APPN',        description: 'ESME receiver temporary app error.',                         category: 'TEMP_ERROR', retryable: true  },
  { code: '0x00000065', hex: '65', name: 'ESME_RX_P_APPN',        description: 'ESME receiver permanent app error.',                         category: 'PERM_ERROR', retryable: false },
  { code: '0x00000066', hex: '66', name: 'ESME_RX_R_APPN',        description: 'ESME receiver reject message error.',                        category: 'PERM_ERROR', retryable: false },
  { code: '0x00000067', hex: '67', name: 'ESME_RQUERYFAIL',       description: 'Query SM request failed.',                                    category: 'TEMP_ERROR', retryable: false },
  { code: '0x000000C0', hex: 'C0', name: 'ESME_RINVOPTIONOPTPAR', description: 'Error in optional part of the PDU body.',                     category: 'PERM_ERROR', retryable: false },
  { code: '0x000000C1', hex: 'C1', name: 'ESME_ROPTPARNOTALLWD',  description: 'Optional parameter not allowed.',                            category: 'PERM_ERROR', retryable: false },
  { code: '0x000000C2', hex: 'C2', name: 'ESME_RINVPARLEN',       description: 'Invalid parameter length.',                                   category: 'PERM_ERROR', retryable: false },
  { code: '0x000000C3', hex: 'C3', name: 'ESME_RMISSINGOPTPARAM', description: 'Expected optional parameter missing.',                        category: 'PERM_ERROR', retryable: false },
  { code: '0x000000C4', hex: 'C4', name: 'ESME_RINVOPTPARAMVAL',  description: 'Invalid optional parameter value.',                          category: 'PERM_ERROR', retryable: false },
  { code: '0x000000FE', hex: 'FE', name: 'ESME_RDELIVERYFAILURE', description: 'Delivery failure — network or handset error.',               category: 'TEMP_ERROR', retryable: true  },
  { code: '0x000000FF', hex: 'FF', name: 'ESME_RUNKNOWNERR',      description: 'Unknown error — contact SMSC support.',                       category: 'TEMP_ERROR', retryable: true  },
]

const categoryConfig = {
  SUCCESS:    { label: 'Success',    icon: CheckCircle2,   className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  TEMP_ERROR: { label: 'Temp Error', icon: AlertTriangle,  className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'     },
  PERM_ERROR: { label: 'Perm Error', icon: XCircle,        className: 'bg-rose-500/10 text-rose-600 border-rose-500/20'        },
  VENDOR:     { label: 'Vendor',     icon: Info,            className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'        },
}

export default function ErrorCodesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('ALL')

  const filtered = useMemo(() => SMPP_ERROR_CODES.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = e.code.toLowerCase().includes(q) ||
      e.hex.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    const matchFilter = filter === 'ALL' || e.category === filter
    return matchSearch && matchFilter
  }), [search, filter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Error Code Mapper</h1>
        <p className="text-muted-foreground">SMPP error codes reference — search by code, name, or description</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code, name, description…"
            className="pl-9 h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'SUCCESS', 'TEMP_ERROR', 'PERM_ERROR'].map(cat => {
            const cfg = cat === 'ALL' ? null : categoryConfig[cat as keyof typeof categoryConfig]
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  filter === cat
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {cat === 'ALL' ? 'All' : cfg!.label}
              </button>
            )
          })}
        </div>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} codes</span>
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(e => {
          const cfg = categoryConfig[e.category]
          const Icon = cfg.icon
          return (
            <Card key={e.code} className="border-border/50 hover:border-border transition-colors">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono font-bold">{e.code}</code>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {cfg.label}
                    </Badge>
                    {e.retryable && (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                        Retryable
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="font-mono text-xs text-muted-foreground">{e.name}</div>
                <p className="text-sm text-foreground/80 leading-snug">{e.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          No error codes match your search
        </div>
      )}
    </div>
  )
}
