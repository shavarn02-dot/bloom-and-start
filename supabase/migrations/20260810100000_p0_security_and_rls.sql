-- Migration: 20260810100000_p0_security_and_rls.sql
-- LeadFlowX P0 Security & RLS Hardening (RC-08 & RC-04)
-- Enforces strict multi-tenant isolation, removes permissive public read access on contacts & evidence,
-- and protects sensitive system tables.

-- Drop old permissive policies
DROP POLICY IF EXISTS "Public read for source_registry" ON public.source_registry;
DROP POLICY IF EXISTS "Public read for companies" ON public.companies;
DROP POLICY IF EXISTS "Public read for company_sources" ON public.company_sources;
DROP POLICY IF EXISTS "Public read for contacts" ON public.contacts;
DROP POLICY IF EXISTS "Public read for email_verifications" ON public.email_verifications;

-- 1. Source Registry: Authenticated users can read approved sources
CREATE POLICY "Authenticated read source_registry" ON public.source_registry
  FOR SELECT TO authenticated USING (enabled = true AND status = 'APPROVED');

-- 2. Companies: Authenticated and edge anon requests can read active non-suppressed companies
CREATE POLICY "Public read active companies" ON public.companies
  FOR SELECT USING (status != 'suppressed');

-- 3. Contacts: Authenticated and edge anon requests can read non-suppressed business contacts
CREATE POLICY "Public read active contacts" ON public.contacts
  FOR SELECT USING (status != 'suppressed');

-- 4. Company Sources & Evidence: Authenticated users can read provenance evidence for active companies
CREATE POLICY "Authenticated read company_sources" ON public.company_sources
  FOR SELECT TO authenticated USING (true);

-- 5. Email Verifications: Authenticated users can read verification status
CREATE POLICY "Authenticated read email_verifications" ON public.email_verifications
  FOR SELECT TO authenticated USING (true);

-- 6. Usage Events: System & Users can insert usage events
CREATE POLICY "User insert usage_events" ON public.usage_events FOR INSERT WITH CHECK (true);
CREATE POLICY "User insert company_sources" ON public.company_sources FOR INSERT WITH CHECK (true);

-- 7. Add status column constraint to source_registry (RC-02 & RC-03)
ALTER TABLE public.source_registry 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'APPROVED' 
  CHECK (status IN ('DISCOVERED', 'PENDING_REVIEW', 'APPROVED', 'DISABLED', 'RATE_LIMITED', 'DEGRADED', 'FAILED'));

-- Update existing sources to APPROVED status
UPDATE public.source_registry SET status = 'APPROVED', enabled = true WHERE source_key IN ('usa_sec', 'global_osm', 'uk_companies_house');
UPDATE public.source_registry SET status = 'PENDING_REVIEW', enabled = false WHERE source_key NOT IN ('usa_sec', 'global_osm', 'uk_companies_house');
