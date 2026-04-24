import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings2 } from 'lucide-react'

export default function SystemSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Platform-wide configuration and global traffic limits</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle>General</CardTitle>
            </div>
            <CardDescription>Core platform identification</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Platform Name</Label>
              <Input defaultValue="TelvoiceSMS Platform" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Timezone</Label>
              <Select defaultValue="America/Santiago">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Santiago">America/Santiago (CLT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/Madrid">Europe/Madrid (CET)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Default Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Global Traffic Limits</CardTitle>
            <CardDescription>Maximum throughput across all clients</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Max SMS/second (global)</Label>
              <Input type="number" defaultValue="10000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max concurrent SMPP sessions</Label>
              <Input type="number" defaultValue="500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Message retention (days)</Label>
              <Input type="number" defaultValue="90" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Low balance alert threshold (USD)</Label>
              <Input type="number" defaultValue="10" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save System Settings</Button>
      </div>
    </div>
  )
}
