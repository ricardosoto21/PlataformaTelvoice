-- TelvoiceSMS Platform - Phase 1 Database Schema
-- Creates: profiles, customers, vendors, smpp_accounts tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (linked to auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('ADMIN', 'MANAGER', 'USER')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CLIENT', 'WHOLESALE', 'RESELLER')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'CLP', 'MXN', 'BRL', 'ARS', 'COP', 'PEN')),
  balance DECIMAL(15, 4) DEFAULT 0,
  credit_limit DECIMAL(15, 4) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read customers
CREATE POLICY "customers_select_authenticated" ON public.customers 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins and managers can insert/update/delete
CREATE POLICY "customers_insert_admin" ON public.customers 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "customers_update_admin" ON public.customers 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "customers_delete_admin" ON public.customers 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================
-- VENDORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  -- SMPP Configuration
  smpp_host TEXT,
  smpp_port INTEGER DEFAULT 2775,
  smpp_system_id TEXT,
  smpp_password TEXT,
  smpp_system_type TEXT,
  smpp_bind_mode TEXT DEFAULT 'TRX' CHECK (smpp_bind_mode IN ('TX', 'RX', 'TRX')),
  smpp_max_connections INTEGER DEFAULT 1,
  smpp_throughput INTEGER DEFAULT 100,
  smpp_ton INTEGER DEFAULT 1,
  smpp_npi INTEGER DEFAULT 1,
  smpp_encoding TEXT DEFAULT 'GSM',
  smpp_keep_alive_interval INTEGER DEFAULT 30,
  -- Connection status
  connection_status TEXT DEFAULT 'DISCONNECTED' CHECK (connection_status IN ('CONNECTED', 'DISCONNECTED', 'RECONNECTING')),
  last_connected_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read vendors
CREATE POLICY "vendors_select_authenticated" ON public.vendors 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins and managers can insert/update/delete
CREATE POLICY "vendors_insert_admin" ON public.vendors 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "vendors_update_admin" ON public.vendors 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "vendors_delete_admin" ON public.vendors 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================
-- SMPP ACCOUNTS TABLE (for customers)
-- =============================================
CREATE TABLE IF NOT EXISTS public.smpp_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  system_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  allowed_ips TEXT[], -- Array of allowed IP addresses
  port INTEGER DEFAULT 2775,
  bind_mode TEXT DEFAULT 'TRX' CHECK (bind_mode IN ('TX', 'RX', 'TRX')),
  max_connections INTEGER DEFAULT 1,
  throughput INTEGER DEFAULT 10,
  ton INTEGER DEFAULT 1,
  npi INTEGER DEFAULT 1,
  encoding TEXT DEFAULT 'GSM',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smpp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smpp_accounts_select_authenticated" ON public.smpp_accounts 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "smpp_accounts_insert_admin" ON public.smpp_accounts 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "smpp_accounts_update_admin" ON public.smpp_accounts 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY "smpp_accounts_delete_admin" ON public.smpp_accounts 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customers_ref_number ON public.customers(ref_number);
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(active);
CREATE INDEX IF NOT EXISTS idx_customers_parent_id ON public.customers(parent_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(active);
CREATE INDEX IF NOT EXISTS idx_vendors_connection_status ON public.vendors(connection_status);
CREATE INDEX IF NOT EXISTS idx_smpp_accounts_customer_id ON public.smpp_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_smpp_accounts_system_id ON public.smpp_accounts(system_id);

-- =============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'USER')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smpp_accounts_updated_at
  BEFORE UPDATE ON public.smpp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
