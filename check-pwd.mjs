import { createClient } from '@supabase/supabase-js'

const url = 
const key = 
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
