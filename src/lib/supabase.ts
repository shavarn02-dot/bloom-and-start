import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vkwerkdqffvcydksmebn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2yjgPV4IIo5uXGuy1ETAEg_rRxlyZ2W";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Redirect URL after OAuth — must match Supabase allowed list */
export const OAUTH_REDIRECT = typeof window !== "undefined"
  ? `${window.location.origin}/auth/callback`
  : "https://leadflowx.pages.dev/auth/callback";
