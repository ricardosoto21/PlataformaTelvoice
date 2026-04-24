import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Server, Copy } from 'lucide-react'
import { getSmppAccounts } from '@/lib/smpp-account-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteSmppAccountButton } from './delete-smpp-account-button'

interface SmppAccountWithCustomer {
  id: string
  system_id: string
  password: string
  customer_id: string
  port: number
  bind_mode: string
  max_connections: number
  throughput: number
  active: boolean
  allowed_ips: string[] | null
  customer: {
    id: string
    name: string
    ref_number: string
  } | null
}

export default async function SmppAccountsPage() {
  const accounts = await getSmppAccounts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SMPP Accounts</h1>
          <p className="text-muted-foreground">
            Manage customer SMPP connection credentials
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/smpp-accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Account
          </Link>
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">All SMPP Accounts</CardTitle>
              <CardDescription>{accounts.length} total accounts</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search accounts..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>System ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Bind Mode</TableHead>
                <TableHead>Throughput</TableHead>
                <TableHead>Allowed IPs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Server className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No SMPP accounts yet</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/smpp-accounts/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first account
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account: SmppAccountWithCustomer) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {account.system_id}
                    </TableCell>
                    <TableCell>
                      {account.customer ? (
                        <div>
                          <p className="font-medium">{account.customer.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {account.customer.ref_number}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {account.port}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.bind_mode}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {account.throughput} msg/s
                    </TableCell>
                    <TableCell>
                      {account.allowed_ips && account.allowed_ips.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {account.allowed_ips.length} IP(s)
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Any</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.active ? 'default' : 'secondary'}>
                        {account.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/smpp-accounts/${account.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DeleteSmppAccountButton id={account.id} systemId={account.system_id} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
