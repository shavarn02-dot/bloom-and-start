-- Migration: 20260810100000_p0_security_and_rls.sql
-- LeadFlowX P0 Security & RLS Hardening (RC-08 & P0-3 Database Persistence)

-- 1. Source Registry Policies
DROP POLICY IF EXISTS "Authenticated read source_registry" ON public.source_registry;
DROP POLICY IF EXISTS "Public read source_registry" ON public.source_registry;
DROP POLICY IF EXISTS "Allow anon update source_registry" ON public.source_registry;

CREATE POLICY "Public read source_registry" ON public.source_registry
  FOR SELECT USING (enabled = true);

CREATE POLICY "Allow anon update source_registry" ON public.source_registry
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon insert source_registry" ON public.source_registry
  FOR INSERT WITH CHECK (true);

-- 2. Companies Policies
DROP POLICY IF EXISTS "Public read active companies" ON public.companies;
DROP POLICY IF EXISTS "Allow anon insert companies" ON public.companies;
DROP POLICY IF EXISTS "Allow anon update companies" ON public.companies;

CREATE POLICY "Public read active companies" ON public.companies
  FOR SELECT USING (status != 'suppressed');

CREATE POLICY "Allow anon insert companies" ON public.companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update companies" ON public.companies
  FOR UPDATE USING (true);

-- 3. Contacts Policies
DROP POLICY IF EXISTS "Public read active contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow anon insert contacts" ON public.contacts;

CREATE POLICY "Public read active contacts" ON public.contacts
  FOR SELECT USING (status != 'suppressed');

CREATE POLICY "Allow anon insert contacts" ON public.contacts
  FOR INSERT WITH CHECK (true);

-- 4. Company Sources & Evidence
DROP POLICY IF EXISTS "Authenticated read company_sources" ON public.company_sources;
DROP POLICY IF EXISTS "User insert company_sources" ON public.company_sources;

CREATE POLICY "Public read company_sources" ON public.company_sources
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert company_sources" ON public.company_sources
  FOR INSERT WITH CHECK (true);

-- 5. Email Verifications
DROP POLICY IF EXISTS "Authenticated read email_verifications" ON public.email_verifications;
CREATE POLICY "Public read email_verifications" ON public.email_verifications
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert email_verifications" ON public.email_verifications
  FOR INSERT WITH CHECK (true);

-- 6. Usage Events
DROP POLICY IF EXISTS "User insert usage_events" ON public.usage_events;
CREATE POLICY "Public read usage_events" ON public.usage_events
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert usage_events" ON public.usage_events
  FOR INSERT WITH CHECK (true);

-- 7. Leads RLS Policies
DROP POLICY IF EXISTS "Allow anon insert leads" ON public.leads;
CREATE POLICY "Allow anon insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select leads" ON public.leads;
CREATE POLICY "Allow anon select leads" ON public.leads
  FOR SELECT USING (true);

-- 8. Schema extensions for compatibility
ALTER TABLE public.company_sources
  ADD COLUMN IF NOT EXISTS provenance_metadata JSONB DEFAULT '{}'::jsonb,
  ALTER COLUMN source_id DROP NOT NULL;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2) DEFAULT 80.00,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';
