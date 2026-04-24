import Link from 'next/link'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react'
import { getVendors } from '@/lib/vendor-actions'
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
import { DeleteVendorButton } from './delete-vendor-button'
import type { Vendor } from '@/lib/types'

function getConnectionStatusColor(status: string) {
  switch (status) {
    case 'CONNECTED':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'RECONNECTING':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'DISCONNECTED':
    default:
      return 'bg-red-500/10 text-red-500 border-red-500/20'
  }
}

function getConnectionIcon(status: string) {
  switch (status) {
    case 'CONNECTED':
      return <Wifi className="h-3 w-3" />
    case 'RECONNECTING':
      return <Wifi className="h-3 w-3 animate-pulse" />
    case 'DISCONNECTED':
    default:
      return <WifiOff className="h-3 w-3" />
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage SMPP provider connections
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Link>
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">All Vendors</CardTitle>
              <CardDescription>{vendors.length} total vendors</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>SMPP Host</TableHead>
                <TableHead>System ID</TableHead>
                <TableHead>Bind Mode</TableHead>
                <TableHead>Throughput</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No vendors yet</p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/vendors/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first vendor
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor: Vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        {vendor.email && (
                          <p className="text-sm text-muted-foreground">{vendor.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {vendor.smpp_host ? `${vendor.smpp_host}:${vendor.smpp_port}` : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {vendor.smpp_system_id || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{vendor.smpp_bind_mode}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {vendor.smpp_throughput} msg/s
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`gap-1 ${getConnectionStatusColor(vendor.connection_status)}`}
                      >
                        {getConnectionIcon(vendor.connection_status)}
                        {vendor.connection_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.active ? 'default' : 'secondary'}>
                        {vendor.active ? 'Active' : 'Inactive'}
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
                            <Link href={`/dashboard/vendors/${vendor.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DeleteVendorButton id={vendor.id} name={vendor.name} />
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
