import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function SMTPSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMTP Manager</h1>
        <p className="text-muted-foreground">Configure the outgoing mail server for platform notifications</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Server Configuration</CardTitle>
            </div>
            <CardDescription>SMTP connection settings</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Port</Label>
                <Input type="number" defaultValue="587" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Encryption</Label>
                <Select defaultValue="TLS">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TLS">TLS (STARTTLS)</SelectItem>
                    <SelectItem value="SSL">SSL</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Username</Label>
              <Input placeholder="notifications@telvoice.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Sender Identity</CardTitle>
            <CardDescription>How emails appear to recipients</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>From Name</Label>
              <Input defaultValue="TelvoiceSMS Platform" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>From Email</Label>
              <Input defaultValue="no-reply@telvoice.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reply-To Email</Label>
              <Input placeholder="support@telvoice.com" />
            </div>

            <div className="mt-4 rounded-lg border border-border/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Connection Status</p>
                  <p className="text-xs text-muted-foreground">Not tested yet</p>
                </div>
              </div>
              <Badge variant="secondary">Untested</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline">Test Connection</Button>
        <Button>Save SMTP Settings</Button>
      </div>
    </div>
  )
}
