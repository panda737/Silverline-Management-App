import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * The one Supabase client for the whole SPA. Session lives in localStorage and
 * auto-refreshes; RLS (not this client) is the security boundary.
 * detectSessionInUrl stays on — invite/recovery links land with hash tokens.
 */
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
