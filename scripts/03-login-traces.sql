-- Login traces table for access history and audit
CREATE TABLE IF NOT EXISTS login_traces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username    text NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address  text,
  country     text,
  device      text,
  result      text NOT NULL DEFAULT 'SUCCESS', -- SUCCESS | FAILED
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_traces_created_at ON login_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_traces_user_id ON login_traces(user_id);

ALTER TABLE login_traces ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'login_traces' AND policyname = 'auth_full_login_traces'
  ) THEN
    CREATE POLICY "auth_full_login_traces" ON login_traces FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
