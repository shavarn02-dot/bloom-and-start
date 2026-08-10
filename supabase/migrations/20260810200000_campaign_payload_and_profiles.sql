-- Migration: 20260810200000_campaign_payload_and_profiles.sql
-- Fixes P0-1 Critical Blocker: Targets CORRECT production table public.lead_campaigns

-- 1. Extend public.lead_campaigns table to persist multi-country locations and search mode contract
ALTER TABLE public.lead_campaigns
  ADD COLUMN IF NOT EXISTS locations text[] DEFAULT ARRAY['IN', 'US'],
  ADD COLUMN IF NOT EXISTS search_mode text DEFAULT 'smart' CHECK (search_mode IN ('smart', 'deep')),
  ADD COLUMN IF NOT EXISTS freshness_preference text DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS allow_deep_search boolean DEFAULT false;

-- 2. Add status column to source_registry (P0-5 Fix)
ALTER TABLE public.source_registry
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'APPROVED'
  CHECK (status IN ('DISCOVERED', 'PENDING_REVIEW', 'APPROVED', 'DISABLED', 'RATE_LIMITED', 'DEGRADED', 'FAILED'));

-- 3. Business Profiles policies
DROP POLICY IF EXISTS "Users manage own business_profiles" ON public.business_profiles;
DROP POLICY IF EXISTS "Public read business_profiles" ON public.business_profiles;

CREATE POLICY "Public read business_profiles" ON public.business_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert business_profiles" ON public.business_profiles
  FOR INSERT WITH CHECK (true);
