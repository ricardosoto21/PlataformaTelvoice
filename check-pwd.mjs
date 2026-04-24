import { createClient } from '@supabase/supabase-js'

const url = "https://dcqklwovpwlaweimyvqg.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcWtsd292cHdsYXdlaW15dnFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjMwMDU4NSwiZXhwIjoyMDkxODc2NTg1fQ.I5s3uStyW5AMj4nS6LmP-EhH65Lpf8qp0Ea12SSat30"

const supabase = createClient(url, key)

async function check() {
  const { data, error } = await supabase
    .from('lcr_rules')
    .select('id, mcc, mnc, vendor_id, route_id, priority, cost, active')

  if (error) {
    console.error('Error:', error.message)
    return
  }
  console.log('\n--- LCR Rules in DB ---')
  console.table(data)

}

check()
