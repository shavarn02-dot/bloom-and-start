-- Fix RLS Policies for lead_campaigns, leads, business_profiles, documents
-- Allow anon and authenticated users to insert, update, select campaigns and leads

drop policy if exists "users manage their campaigns" on public.lead_campaigns;
drop policy if exists "users manage their business profiles" on public.business_profiles;
drop policy if exists "users manage their leads" on public.leads;
drop policy if exists "users manage their documents" on public.documents;

create policy "allow all access to campaigns" on public.lead_campaigns for all using (true) with check (true);
create policy "allow all access to business profiles" on public.business_profiles for all using (true) with check (true);
create policy "allow all access to leads" on public.leads for all using (true) with check (true);
create policy "allow all access to documents" on public.documents for all using (true) with check (true);
