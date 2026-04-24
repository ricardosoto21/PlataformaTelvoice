-- ============================================================
-- SMPP Engine Support Tables
-- Creates tables required by the TelvoiceSMS SMPP Motor
-- ============================================================

-- ------------------------------------------------------------
-- 1. MCC/MNC lookup table (for destination routing by network)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mcc_mnc (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mcc         varchar(3) NOT NULL,
  mnc         varchar(3) NOT NULL,
  country     varchar(100) NOT NULL,
  operator    varchar(100) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mcc, mnc)
);

-- Seed with major networks
INSERT INTO mcc_mnc (mcc, mnc, country, operator) VALUES
  ('310', '010', 'United States', 'AT&T Wireless'),
  ('310', '260', 'United States', 'T-Mobile USA'),
  ('311', '480', 'United States', 'Verizon Wireless'),
  ('310', '120', 'United States', 'Sprint'),
  ('334', '020', 'Mexico', 'Telcel'),
  ('334', '030', 'Mexico', 'Movistar Mexico'),
  ('334', '050', 'Mexico', 'AT&T Mexico'),
  ('724', '010', 'Brazil', 'Claro Brazil'),
  ('724', '006', 'Brazil', 'Vivo'),
  ('724', '023', 'Brazil', 'TIM Brazil'),
  ('732', '101', 'Colombia', 'Claro Colombia'),
  ('732', '123', 'Colombia', 'Movistar Colombia'),
  ('732', '102', 'Colombia', 'Tigo Colombia'),
  ('716', '010', 'Peru', 'Movistar Peru'),
  ('716', '006', 'Peru', 'Claro Peru'),
  ('722', '310', 'Argentina', 'Claro Argentina'),
  ('722', '070', 'Argentina', 'Movistar Argentina'),
  ('748', '010', 'Uruguay', 'Antel'),
  ('730', '010', 'Chile', 'Entel Chile'),
  ('730', '003', 'Chile', 'Movistar Chile')
ON CONFLICT (mcc, mnc) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Load distribution rules
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS load_distributions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid REFERENCES customers(id) ON DELETE CASCADE,
  vendor_id        uuid REFERENCES vendors(id) ON DELETE CASCADE,
  mcc              varchar(3) NOT NULL,
  mnc              varchar(3),
  load_percentage  numeric(5,2) NOT NULL DEFAULT 100,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_load_dist_customer_mcc ON load_distributions(customer_id, mcc, mnc);

-- ------------------------------------------------------------
-- 3. SMPP Engine events log (optional — for UI event feed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS smpp_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  varchar(50) NOT NULL,   -- BIND, UNBIND, SUBMIT, DLR, ERROR, etc.
  system_id   varchar(50),
  vendor_id   uuid REFERENCES vendors(id) ON DELETE SET NULL,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smpp_events_created ON smpp_events(created_at DESC);

-- ------------------------------------------------------------
-- 4. Add columns to messages table if missing
-- ------------------------------------------------------------
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sent_at         timestamptz,
  ADD COLUMN IF NOT EXISTS dlr_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_code      varchar(50),
  ADD COLUMN IF NOT EXISTS dlr_status      varchar(20);

-- ------------------------------------------------------------
-- 5. Add columns to smpp_accounts for engine use
-- ------------------------------------------------------------
ALTER TABLE smpp_accounts
  ADD COLUMN IF NOT EXISTS host            varchar(255),
  ADD COLUMN IF NOT EXISTS port            integer DEFAULT 2775,
  ADD COLUMN IF NOT EXISTS ip_whitelist    text[],
  ADD COLUMN IF NOT EXISTS throughput_limit integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_connections  integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS type           varchar(20) DEFAULT 'CUSTOMER' CHECK (type IN ('CUSTOMER', 'VENDOR')),
  ADD COLUMN IF NOT EXISTS vendor_id      uuid REFERENCES vendors(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 6. RLS policies for new tables
-- ------------------------------------------------------------
ALTER TABLE mcc_mnc ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated users can read mcc_mnc"
  ON mcc_mnc FOR SELECT TO authenticated USING (true);

ALTER TABLE load_distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admins manage load distributions"
  ON load_distributions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE smpp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated users read smpp events"
  ON smpp_events FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Service role inserts smpp events"
  ON smpp_events FOR INSERT TO service_role WITH CHECK (true);
