import { createClient } from "@supabase/supabase-js";

export const socialSupabase = createClient(
  import.meta.env.VITE_SOCIAL_SUPABASE_URL,
  import.meta.env.VITE_SOCIAL_SUPABASE_ANON_KEY
);