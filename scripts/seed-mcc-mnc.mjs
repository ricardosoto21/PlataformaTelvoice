import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Small sample of MCC/MNC dataset for initial seeding.
// The user can expand this array as needed.
const mccMncData = [
  { mcc: "730", mnc: "01", country: "Chile", operator: "Entel", country_code: "56" },
  { mcc: "730", mnc: "02", country: "Chile", operator: "Movistar", country_code: "56" },
  { mcc: "730", mnc: "03", country: "Chile", operator: "Claro", country_code: "56" },
  { mcc: "730", mnc: "09", country: "Chile", operator: "WOM", country_code: "56" },
  { mcc: "310", mnc: "410", country: "United States", operator: "AT&T", country_code: "1" },
  { mcc: "310", mnc: "260", country: "United States", operator: "T-Mobile", country_code: "1" },
  { mcc: "311", mnc: "480", country: "United States", operator: "Verizon", country_code: "1" },
  { mcc: "334", mnc: "020", country: "Mexico", operator: "Telcel", country_code: "52" },
  { mcc: "334", mnc: "050", country: "Mexico", operator: "AT&T Mexico", country_code: "52" },
  { mcc: "214", mnc: "01", country: "Spain", operator: "Vodafone", country_code: "34" },
  { mcc: "214", mnc: "07", country: "Spain", operator: "Movistar", country_code: "34" }
]

function getEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return process.env
  
  const raw = fs.readFileSync(envPath, 'utf8')
  const env = { ...process.env }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue
    
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

async function seed() {
  const env = getEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log(`Starting to seed ${mccMncData.length} MCC/MNC records...`)
  let successCount = 0

  for (const entry of mccMncData) {
    const { error } = await supabase
      .from('mcc_mnc')
      .upsert({
        mcc: entry.mcc,
        mnc: entry.mnc,
        country: entry.country,
        operator: entry.operator,
        country_code: entry.country_code,
        active: true
      }, { onConflict: 'mcc, mnc' })
    
    const { error: opError } = await supabase
      .from('network_operators')
      .upsert({
        mcc: entry.mcc,
        mnc: entry.mnc,
        country: entry.country,
        operator: entry.operator,
        active: true
      }, { onConflict: 'mcc, mnc' })

    if (error || opError) {
      console.error(`Failed to seed ${entry.mcc}-${entry.mnc}:`, error?.message || opError?.message)
    } else {
      successCount++
    }
  }

  console.log(`Seeding complete. Successfully seeded ${successCount} records.`)
}

seed()
