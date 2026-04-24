import { createClient } from '@/lib/supabase/server'
import { EmailTemplatesClient } from './email-templates-client'

export default async function EmailTemplatesPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground">Notification templates sent to customers — supports {'{{variable}}'} placeholders</p>
      </div>
      <EmailTemplatesClient initialTemplates={templates ?? []} />
    </div>
  )
}
