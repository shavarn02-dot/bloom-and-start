-- LeadGen scrape engine schema.
-- Adds tables for job tracking, source tracking, email verification,
-- AI provider usage monitoring, and per-user quota enforcement.
-- Depends on 20260808000000_initial_leadgen.sql being applied first.

----------------------------------------------------------------------
-- 1. Scrape Jobs — tracks each scraping job run on Modal
----------------------------------------------------------------------
create table if not exists public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.lead_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'extracting', 'verifying', 'scoring', 'completed', 'failed', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  total_urls_found integer not null default 0,
  total_urls_scraped integer not null default 0,
  total_leads_extracted integer not null default 0,
  total_emails_verified integer not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

----------------------------------------------------------------------
-- 2. Lead Sources — where each lead was discovered
----------------------------------------------------------------------
create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  url text not null,
  page_type text not null default 'unknown'
    check (page_type in ('homepage', 'about', 'contact', 'team', 'directory', 'search_result', 'social', 'unknown')),
  scrape_tier text not null default 'httpx'
    check (scrape_tier in ('httpx', 'crawl4ai', 'playwright')),
  http_status integer,
  content_hash text,                -- for dedup: sha256 of extracted text
  scraped_at timestamptz not null default now()
);

----------------------------------------------------------------------
-- 3. Email Verifications — cache verification results
----------------------------------------------------------------------
create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  domain text not null,
  mx_valid boolean,
  mx_records text[],                -- MX hostnames found
  smtp_valid boolean,               -- null = not checked yet
  is_disposable boolean not null default false,
  is_catch_all boolean,             -- null = unknown
  is_role_account boolean not null default false,  -- info@, admin@, etc.
  verification_method text not null default 'mx'
    check (verification_method in ('mx', 'smtp', 'pattern_only')),
  verified_at timestamptz not null default now(),
  unique (email)
);

----------------------------------------------------------------------
-- 4. Provider Usage — track AI provider consumption per day
----------------------------------------------------------------------
create table if not exists public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('cerebras', 'groq', 'mistral', 'cloudflare_ai', 'ollama')),
  usage_date date not null default current_date,
  tokens_used bigint not null default 0,
  requests_made integer not null default 0,
  errors integer not null default 0,
  avg_latency_ms integer,
  last_error text,
  updated_at timestamptz not null default now(),
  unique (provider, usage_date)
);

----------------------------------------------------------------------
-- 5. User Quotas — per-user campaign and lead limits
----------------------------------------------------------------------
create table if not exists public.user_quotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null default date_trunc('month', current_date)::date,
  campaigns_used integer not null default 0,
  campaigns_limit integer not null default 10,
  leads_generated integer not null default 0,
  leads_limit integer not null default 500,
  scrape_minutes_used numeric(8, 2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

----------------------------------------------------------------------
-- Indexes
----------------------------------------------------------------------
create index if not exists scrape_jobs_campaign_id_idx on public.scrape_jobs(campaign_id);
create index if not exists scrape_jobs_user_status_idx on public.scrape_jobs(user_id, status);
create index if not exists lead_sources_lead_id_idx on public.lead_sources(lead_id);
create index if not exists lead_sources_url_idx on public.lead_sources(url);
create index if not exists email_verifications_email_idx on public.email_verifications(email);
create index if not exists email_verifications_domain_idx on public.email_verifications(domain);
create index if not exists provider_usage_provider_date_idx on public.provider_usage(provider, usage_date);
create index if not exists user_quotas_user_month_idx on public.user_quotas(user_id, month);

----------------------------------------------------------------------
-- RLS
----------------------------------------------------------------------
alter table public.scrape_jobs enable row level security;
alter table public.lead_sources enable row level security;
alter table public.email_verifications enable row level security;
alter table public.provider_usage enable row level security;
alter table public.user_quotas enable row level security;

-- Users can view/manage their own scrape jobs
create policy "users manage their scrape jobs" on public.scrape_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users can view sources of their own leads (join via leads table)
create policy "users view their lead sources" on public.lead_sources
  for select using (
    exists (
      select 1 from public.leads l where l.id = lead_sources.lead_id and l.user_id = auth.uid()
    )
  );

-- Email verifications are shared (public read, service-role write)
create policy "anyone can read email verifications" on public.email_verifications
  for select using (true);

-- Provider usage is system-level (service-role only for write, public read)
create policy "anyone can read provider usage" on public.provider_usage
  for select using (true);

-- Users can view their own quotas
create policy "users view their quotas" on public.user_quotas
  for select using (auth.uid() = user_id);

----------------------------------------------------------------------
-- Updated-at triggers (reuse the function from initial migration)
----------------------------------------------------------------------
drop trigger if exists scrape_jobs_set_updated_at on public.scrape_jobs;
create trigger scrape_jobs_set_updated_at before update on public.scrape_jobs
for each row execute function public.set_updated_at();

drop trigger if exists provider_usage_set_updated_at on public.provider_usage;
create trigger provider_usage_set_updated_at before update on public.provider_usage
for each row execute function public.set_updated_at();

drop trigger if exists user_quotas_set_updated_at on public.user_quotas;
create trigger user_quotas_set_updated_at before update on public.user_quotas
for each row execute function public.set_updated_at();
