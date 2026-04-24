-- Auxiliary tables for tools that aren't covered by the main migration

-- Test messages (used by Message Tester tool)
CREATE TABLE IF NOT EXISTS test_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid REFERENCES customers(id) ON DELETE SET NULL,
  from_number     text,
  to_number       text NOT NULL,
  text            text NOT NULL,
  status          text NOT NULL DEFAULT 'QUEUED',
  dlr_status      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Re-push DLR jobs (used by Re-Push DLR tool)
CREATE TABLE IF NOT EXISTS repush_dlr_jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid REFERENCES messages(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  dlr_status  text NOT NULL DEFAULT 'DELIVERED',
  status      text NOT NULL DEFAULT 'PENDING',
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE repush_dlr_jobs  ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (admin platform)
CREATE POLICY "auth_full_test_messages"   ON test_messages   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_full_repush_dlr_jobs" ON repush_dlr_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
