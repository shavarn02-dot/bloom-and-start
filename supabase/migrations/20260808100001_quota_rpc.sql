-- Quota increment RPC function.
-- Called by the Cloudflare Worker to atomically increment a user's campaign count.
-- Uses INSERT ... ON CONFLICT for upsert behavior.

create or replace function public.increment_campaign_quota(p_user_id uuid, p_month date)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_quotas (user_id, month, campaigns_used, campaigns_limit, leads_limit)
  values (p_user_id, p_month, 1, 10, 500)
  on conflict (user_id, month)
  do update set
    campaigns_used = user_quotas.campaigns_used + 1,
    updated_at = now();
end;
$$;

-- Grant execute to authenticated users (called via service role from Worker)
grant execute on function public.increment_campaign_quota(uuid, date) to service_role;
