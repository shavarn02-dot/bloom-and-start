-- LeadGen AI foundation schema.
-- Apply with the Supabase CLI or paste into the SQL editor.
-- All customer-facing tables are protected by RLS and scoped to auth.uid().

create extension if not exists pgcrypto;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text,
  description text,
  target_customer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  name text not null,
  query text not null,
  status text not null default 'draft' check (status in ('draft', 'queued', 'running', 'completed', 'failed', 'paused')),
  requested_limit integer not null default 25 check (requested_limit between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.lead_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  title text,
  email text,
  phone text,
  website text,
  source_url text,
  source_type text not null default 'public_web',
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  confidence numeric(5, 2) check (confidence between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, company_name, contact_name, email)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text,
  mime_type text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_profiles_user_id_idx on public.business_profiles(user_id);
create index if not exists lead_campaigns_user_id_status_idx on public.lead_campaigns(user_id, status);
create index if not exists leads_campaign_id_idx on public.leads(campaign_id);
create index if not exists leads_user_id_verification_idx on public.leads(user_id, verification_status);
create index if not exists documents_user_id_idx on public.documents(user_id);

alter table public.business_profiles enable row level security;
alter table public.lead_campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.documents enable row level security;

create policy "users manage their business profiles" on public.business_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their campaigns" on public.lead_campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists business_profiles_set_updated_at on public.business_profiles;
create trigger business_profiles_set_updated_at before update on public.business_profiles
for each row execute function public.set_updated_at();
drop trigger if exists lead_campaigns_set_updated_at on public.lead_campaigns;
create trigger lead_campaigns_set_updated_at before update on public.lead_campaigns
for each row execute function public.set_updated_at();
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();
drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents
for each row execute function public.set_updated_at();
