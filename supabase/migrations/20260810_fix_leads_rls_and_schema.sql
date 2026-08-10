-- =====================================================================
-- LeadFlowX PRODUCTION FIX: Leads RLS + Schema Synchronization
-- Run this ENTIRE script in Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- =====================================================================
-- 1. FIX LEADS RLS (Root cause of saved_leads = 0)
-- The backend inserts via anon key, so we need INSERT + SELECT policies
-- =====================================================================
DROP POLICY IF EXISTS "Allow anon insert leads" ON public.leads;
CREATE POLICY "Allow anon insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select leads" ON public.leads;
CREATE POLICY "Allow anon select leads" ON public.leads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon update leads" ON public.leads;
CREATE POLICY "Allow anon update leads" ON public.leads
  FOR UPDATE USING (true);

-- =====================================================================
-- 2. FIX CONTACTS SCHEMA (confidence_score column missing)
-- The canonical contacts table uses "confidence" (NUMERIC) not "confidence_score"
-- Add aliases for backward compatibility
-- =====================================================================
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2) DEFAULT 80.00,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

-- =====================================================================
-- 3. FIX COMPANY_SOURCES SCHEMA (provenance_metadata + source_id NOT NULL)
-- The ingestion code doesn't always have a source_registry ID
-- =====================================================================

-- Make source_id nullable so inserts without explicit source_registry work
ALTER TABLE public.company_sources
  ALTER COLUMN source_id DROP NOT NULL;

-- Add provenance_metadata column for score breakdowns and crawl evidence
ALTER TABLE public.company_sources
  ADD COLUMN IF NOT EXISTS provenance_metadata JSONB DEFAULT '{}'::jsonb;

-- Add source_type for backward compatibility
ALTER TABLE public.company_sources
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'web_crawl';

-- =====================================================================
-- 4. ENSURE lead_campaigns and scrape_jobs have proper RLS
-- (These are needed for frontend progress polling)
-- =====================================================================
DROP POLICY IF EXISTS "Allow anon select lead_campaigns" ON public.lead_campaigns;
CREATE POLICY "Allow anon select lead_campaigns" ON public.lead_campaigns
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon update lead_campaigns" ON public.lead_campaigns;
CREATE POLICY "Allow anon update lead_campaigns" ON public.lead_campaigns
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon insert lead_campaigns" ON public.lead_campaigns;
CREATE POLICY "Allow anon insert lead_campaigns" ON public.lead_campaigns
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select scrape_jobs" ON public.scrape_jobs;
CREATE POLICY "Allow anon select scrape_jobs" ON public.scrape_jobs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon update scrape_jobs" ON public.scrape_jobs;
CREATE POLICY "Allow anon update scrape_jobs" ON public.scrape_jobs
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon insert scrape_jobs" ON public.scrape_jobs;
CREATE POLICY "Allow anon insert scrape_jobs" ON public.scrape_jobs
  FOR INSERT WITH CHECK (true);

-- =====================================================================
-- 5. VERIFY: Check that RLS is enabled but policies exist
-- =====================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'contacts', 'companies', 'company_sources', 'lead_campaigns', 'scrape_jobs')
ORDER BY tablename, policyname;
