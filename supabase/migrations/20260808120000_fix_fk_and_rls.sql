-- Fix FK constraints and RLS for guest/anonymous access.
-- The original schema requires user_id to reference auth.users(id),
-- but when using the Worker without Supabase Auth, there are no auth.users rows.
-- This migration makes user_id optional or removes the FK constraint where needed.

-- lead_campaigns: make user_id optional (allow guest campaigns)
alter table public.lead_campaigns alter column user_id drop not null;
alter table public.lead_campaigns drop constraint if exists lead_campaigns_user_id_fkey;

-- scrape_jobs: make user_id optional
alter table public.scrape_jobs alter column user_id drop not null;
alter table public.scrape_jobs drop constraint if exists scrape_jobs_user_id_fkey;

-- leads: make user_id optional
alter table public.leads alter column user_id drop not null;
alter table public.leads drop constraint if exists leads_user_id_fkey;

-- user_quotas: make user_id optional (no FK constraint needed for quota tracking)
alter table public.user_quotas drop constraint if exists user_quotas_user_id_fkey;

-- Also open RLS on scrape_jobs and user_quotas for service_role access
drop policy if exists "users manage their scrape jobs" on public.scrape_jobs;
create policy "allow all access to scrape jobs" on public.scrape_jobs
  for all using (true) with check (true);

drop policy if exists "users view their quotas" on public.user_quotas;
create policy "allow all access to user quotas" on public.user_quotas
  for all using (true) with check (true);

-- Email verifications: allow writes too (not just reads)
drop policy if exists "anyone can read email verifications" on public.email_verifications;
create policy "allow all access to email verifications" on public.email_verifications
  for all using (true) with check (true);

-- Provider usage: allow writes
drop policy if exists "anyone can read provider usage" on public.provider_usage;
create policy "allow all access to provider usage" on public.provider_usage
  for all using (true) with check (true);
