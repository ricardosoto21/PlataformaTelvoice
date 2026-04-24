import { createClient } from '@supabase/supabase-js'

const url = "https://dcqklwovpwlaweimyvqg.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcWtsd292cHdsYXdlaW15dnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjMwMDU4NSwiZXhwIjoyMDkxODc2NTg1fQ.I5s3uStyW5AMj4nS6LmP-EhH65Lpf8qp0Ea12SSat30"

const supabase = createClient(url, key)

async function check() {
  const { data, error } = await supabase
    .from('smpp_accounts')
    .select('system_id, password, active')
    .eq('system_id', 'Telvoice')
    .single()

  if (error) {
    console.error("Error fetching from DB:", error.message)
    return
  }

  console.log("Account Details in DB:")
  console.log("System ID:", data.system_id)
  console.log("Password in DB:", data.password)
  console.log("Is Active:", data.active)
}

check()
