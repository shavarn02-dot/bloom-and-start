-- Plan-aware monthly search quotas and user-scoped lead uniqueness.
-- Free: 3 searches/month, 5 leads/search.
-- Premium: 10 searches/month, 50 leads/search.

ALTER TABLE public.user_quotas
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS searches_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS searches_limit integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS leads_per_search_limit integer NOT NULL DEFAULT 5;

ALTER TABLE public.user_quotas
  DROP CONSTRAINT IF EXISTS user_quotas_plan_check;

ALTER TABLE public.user_quotas
  ADD CONSTRAINT user_quotas_plan_check CHECK (plan IN ('free', 'premium'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_fingerprint text;

CREATE OR REPLACE FUNCTION public.set_lead_fingerprint()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lead_fingerprint IS NULL THEN
    NEW.lead_fingerprint := encode(
      digest(
        lower(
          coalesce(NEW.company_name, '') || '|' ||
          coalesce(NULLIF(NEW.email, ''), NULLIF(NEW.contact_name, ''), '')
        ),
        'sha256'
      ),
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_set_fingerprint ON public.leads;
CREATE TRIGGER leads_set_fingerprint
  BEFORE INSERT OR UPDATE OF company_name, contact_name, email, lead_fingerprint
  ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_lead_fingerprint();

CREATE UNIQUE INDEX IF NOT EXISTS leads_user_fingerprint_unique_idx
  ON public.leads (user_id, lead_fingerprint)
  WHERE lead_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_user_created_at_idx
  ON public.leads (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.reserve_lead_search(
  p_user_id uuid,
  p_requested_limit integer,
  p_month date DEFAULT date_trunc('month', current_date)::date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quota_row public.user_quotas%ROWTYPE;
  effective_limit integer;
  effective_searches_limit integer;
BEGIN
  INSERT INTO public.user_quotas (user_id, month)
  VALUES (p_user_id, p_month)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT * INTO quota_row
  FROM public.user_quotas
  WHERE user_id = p_user_id AND month = p_month
  FOR UPDATE;

  effective_searches_limit := CASE WHEN quota_row.plan = 'premium' THEN 10 ELSE 3 END;
  effective_limit := CASE
    WHEN quota_row.plan = 'premium' THEN LEAST(GREATEST(COALESCE(p_requested_limit, 50), 1), 50)
    ELSE LEAST(GREATEST(COALESCE(p_requested_limit, 5), 1), 5)
  END;

  UPDATE public.user_quotas
  SET searches_limit = effective_searches_limit,
      leads_per_search_limit = CASE WHEN quota_row.plan = 'premium' THEN 50 ELSE 5 END,
      leads_limit = CASE WHEN quota_row.plan = 'premium' THEN 500 ELSE 15 END,
      updated_at = now()
  WHERE user_id = p_user_id AND month = p_month;

  IF quota_row.searches_used >= effective_searches_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'plan', quota_row.plan,
      'searches_used', quota_row.searches_used,
      'searches_limit', effective_searches_limit,
      'leads_per_search_limit', CASE WHEN quota_row.plan = 'premium' THEN 50 ELSE 5 END,
      'requested_limit', effective_limit,
      'month', p_month
    );
  END IF;

  UPDATE public.user_quotas
  SET searches_used = searches_used + 1,
      updated_at = now()
  WHERE user_id = p_user_id AND month = p_month;

  RETURN jsonb_build_object(
    'allowed', true,
    'plan', quota_row.plan,
    'searches_used', quota_row.searches_used + 1,
    'searches_limit', effective_searches_limit,
    'leads_per_search_limit', CASE WHEN quota_row.plan = 'premium' THEN 50 ELSE 5 END,
    'requested_limit', effective_limit,
    'month', p_month
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_lead_search_quota(
  p_user_id uuid,
  p_month date DEFAULT date_trunc('month', current_date)::date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quota_row public.user_quotas%ROWTYPE;
BEGIN
  INSERT INTO public.user_quotas (user_id, month)
  VALUES (p_user_id, p_month)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT * INTO quota_row
  FROM public.user_quotas
  WHERE user_id = p_user_id AND month = p_month;

  RETURN jsonb_build_object(
    'plan', quota_row.plan,
    'searches_used', quota_row.searches_used,
    'searches_limit', CASE WHEN quota_row.plan = 'premium' THEN 10 ELSE 3 END,
    'searches_remaining', GREATEST((CASE WHEN quota_row.plan = 'premium' THEN 10 ELSE 3 END) - quota_row.searches_used, 0),
    'leads_per_search_limit', CASE WHEN quota_row.plan = 'premium' THEN 50 ELSE 5 END,
    'monthly_leads_limit', CASE WHEN quota_row.plan = 'premium' THEN 500 ELSE 15 END,
    'month', p_month
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_lead_search(uuid, integer, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_lead_search_quota(uuid, date) TO service_role;
