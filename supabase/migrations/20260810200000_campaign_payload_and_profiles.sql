-- Migration: 20260810200000_campaign_payload_and_profiles.sql
-- Fixes RC-C, RC-D, RC-A database schema requirements

-- 1. Extend campaigns table to persist multi-country locations and search mode contract
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS locations text[] DEFAULT ARRAY['IN', 'US'],
  ADD COLUMN IF NOT EXISTS search_mode text DEFAULT 'smart' CHECK (search_mode IN ('smart', 'deep')),
  ADD COLUMN IF NOT EXISTS freshness_preference text DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS allow_deep_search boolean DEFAULT false;

-- 2. Allow authenticated users to read and manage their business profiles
CREATE POLICY "Users manage own business_profiles" ON public.business_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fallback read policy for edge worker
CREATE POLICY "Public read business_profiles" ON public.business_profiles
  FOR SELECT USING (true);
