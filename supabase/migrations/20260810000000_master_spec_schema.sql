-- Migration: 20260810000000_master_spec_schema.sql
-- LeadFlowX Master Implementation Specification Schema Extensions
-- Additive, non-breaking schema additions for canonical data, evidence tracking, source registry,
-- contact enrichment, email verification, job engine, usage metering, and freshness scoring.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

----------------------------------------------------------------------
-- 1. Source Registry
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  country_codes TEXT[] NOT NULL DEFAULT '{}',
  scope TEXT NOT NULL DEFAULT 'national' CHECK (scope IN ('national', 'regional', 'global')),
  source_type TEXT NOT NULL DEFAULT 'government_registry' CHECK (source_type IN ('government_registry', 'open_data', 'web_crawl', 'directory', 'commercial')),
  base_url TEXT,
  api_url TEXT,
  documentation_url TEXT,
  license_name TEXT,
  license_url TEXT,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT false,
  attribution_required BOOLEAN NOT NULL DEFAULT false,
  terms_url TEXT,
  robots_policy TEXT DEFAULT 'allow',
  enabled BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 10,
  freshness_class TEXT NOT NULL DEFAULT 'monthly' CHECK (freshness_class IN ('realtime', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  rate_limit_requests INTEGER NOT NULL DEFAULT 60,
  rate_limit_window_seconds INTEGER NOT NULL DEFAULT 60,
  daily_budget INTEGER NOT NULL DEFAULT 1000,
  supports_incremental BOOLEAN NOT NULL DEFAULT false,
  supports_bulk BOOLEAN NOT NULL DEFAULT false,
  supports_change_feed BOOLEAN NOT NULL DEFAULT false,
  parser_version TEXT NOT NULL DEFAULT '1.0.0',
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- 2. Canonical Company Database
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  legal_name TEXT,
  normalized_name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  state_region TEXT,
  city TEXT,
  postal_code TEXT,
  address TEXT,
  domain TEXT,
  phone TEXT,
  industry TEXT,
  industry_code TEXT,
  employee_range TEXT,
  revenue_range TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved', 'cancelled')),
  founded_year INTEGER,
  registration_id TEXT,
  source_quality_score NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  freshness_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  contact_completeness_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  cross_source_consistency_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  lead_score NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  last_enriched_at TIMESTAMPTZ,
  next_reverification_at TIMESTAMPTZ,
  suppressed_at TIMESTAMPTZ,
  suppression_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_country ON public.companies(country_code);
CREATE INDEX IF NOT EXISTS idx_companies_normalized_name ON public.companies(normalized_name);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_registration ON public.companies(registration_id) WHERE registration_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

----------------------------------------------------------------------
-- 3. Provenance & Raw Evidence
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.source_registry(id) ON DELETE CASCADE,
  source_record_id TEXT,
  source_url TEXT,
  source_updated_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_hash TEXT,
  evidence_object_key TEXT,
  source_status TEXT NOT NULL DEFAULT 'active',
  confidence NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, source_id, source_record_id)
);

----------------------------------------------------------------------
-- 4. Entity Resolution & Deduplication Log
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entity_match_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_a UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_b UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) NOT NULL,
  match_method TEXT NOT NULL, -- e.g. registration_id, domain, exact_normalized_name
  decision TEXT NOT NULL CHECK (decision IN ('merged', 'separate', 'alias')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- 5. Website Crawl Pages & Change Detection
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crawl_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'homepage' CHECK (page_type IN ('homepage', 'about', 'contact', 'team', 'leadership', 'management', 'careers', 'products')),
  content_hash TEXT,
  content_object_key TEXT,
  last_crawled_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ,
  next_crawl_at TIMESTAMPTZ,
  crawl_status TEXT NOT NULL DEFAULT 'pending' CHECK (crawl_status IN ('pending', 'crawling', 'success', 'unchanged', 'failed')),
  http_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, url)
);

----------------------------------------------------------------------
-- 6. Canonical Contacts
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  source_url TEXT,
  source_id UUID REFERENCES public.source_registry(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 70.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stale', 'suppressed')),
  verification_method TEXT DEFAULT 'unverified' CHECK (verification_method IN ('smtp', 'mx', 'pattern_only', 'unverified')),
  is_public_business_contact BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;

----------------------------------------------------------------------
-- 7. Email Verification Cache
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  mx_valid BOOLEAN,
  mx_records TEXT[],
  smtp_result TEXT,
  disposable BOOLEAN NOT NULL DEFAULT false,
  catch_all BOOLEAN,
  role_based BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'unverified', 'undeliverable', 'risky')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_or_method TEXT NOT NULL DEFAULT 'mx_smtp',
  raw_result_metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

----------------------------------------------------------------------
-- 8. Unified Job Queue
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('INGEST_SOURCE', 'DISCOVER_LEADS', 'ENRICH_COMPANY', 'CRAWL_WEBSITE', 'VERIFY_EMAIL', 'REVERIFY_LEAD', 'AI_CLASSIFY', 'AI_RERANK', 'GENERATE_OUTREACH', 'EXPORT_LEADS')),
  source_id UUID REFERENCES public.source_registry(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  priority INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'retrying', 'failed', 'dead_letter', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(job_type);

----------------------------------------------------------------------
-- 9. Internal Metering & Usage Tracking
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  event_type TEXT NOT NULL CHECK (event_type IN ('DB_SEARCH', 'LIVE_DISCOVERY', 'COMPANY_ENRICHMENT', 'WEBSITE_CRAWL', 'EMAIL_VERIFICATION', 'AI_CALL', 'EXPORT')),
  units INTEGER NOT NULL DEFAULT 1,
  estimated_cost NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_usage_user ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_event_type ON public.usage_events(event_type);

----------------------------------------------------------------------
-- Row Level Security (RLS) Policies
----------------------------------------------------------------------
ALTER TABLE public.source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_match_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to authenticated/anon users for shared reference tables
CREATE POLICY "Public read for source_registry" ON public.source_registry FOR SELECT USING (true);
CREATE POLICY "Public read for companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Public read for company_sources" ON public.company_sources FOR SELECT USING (true);
CREATE POLICY "Public read for contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Public read for email_verifications" ON public.email_verifications FOR SELECT USING (true);

-- User-scoped policies for jobs & usage_events
CREATE POLICY "User read jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "User insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "User read usage_events" ON public.usage_events FOR SELECT USING (auth.uid() = user_id);

----------------------------------------------------------------------
-- Seed Initial Source Registry
----------------------------------------------------------------------
INSERT INTO public.source_registry (
  source_key, display_name, country_codes, scope, source_type, base_url, license_name, commercial_use_allowed, attribution_required, enabled, priority, freshness_class
) VALUES 
('india_mca', 'India Ministry of Corporate Affairs (MCA)', ARRAY['IN'], 'national', 'government_registry', 'https://www.mca.gov.in', 'Government Open Data', true, true, true, 1, 'monthly'),
('india_ogd', 'Open Government Data India (data.gov.in)', ARRAY['IN'], 'national', 'open_data', 'https://data.gov.in', 'Government Open Data License India', true, true, true, 2, 'monthly'),
('usa_sam', 'USA SAM.gov Entity Registrations', ARRAY['US'], 'national', 'government_registry', 'https://sam.gov', 'US Public Domain', true, false, true, 1, 'weekly'),
('usa_sec', 'USA SEC EDGAR Company Database', ARRAY['US'], 'national', 'government_registry', 'https://www.sec.gov/edgar', 'US Public Domain', true, false, true, 2, 'daily'),
('uk_companies_house', 'UK Companies House Registry', ARRAY['GB'], 'national', 'government_registry', 'https://www.gov.uk/government/organisations/companies-house', 'Open Government Licence v3.0', true, true, true, 1, 'daily'),
('australia_abn', 'Australia Business Register (ABN Lookup)', ARRAY['AU'], 'national', 'government_registry', 'https://abr.business.gov.au', 'Australian Open Data', true, true, true, 1, 'monthly'),
('france_sirene', 'France SIRENE Register (INSEE)', ARRAY['FR'], 'national', 'government_registry', 'https://www.insee.fr', 'Licence Ouverte / Open Licence', true, true, true, 1, 'monthly'),
('global_osm', 'OpenStreetMap (OSM) Business Places', ARRAY['*'], 'global', 'open_data', 'https://www.openstreetmap.org', 'ODbL (Open Database License)', true, true, true, 5, 'monthly')
ON CONFLICT (source_key) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  country_codes = EXCLUDED.country_codes,
  enabled = EXCLUDED.enabled,
  updated_at = now();
