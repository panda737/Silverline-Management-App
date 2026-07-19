import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import type { ProfileRow } from "@/lib/database.types";

/**
 * Current user's profile for action functions (non-hook contexts) — the SPA
 * twin of the old server-action `getProfile()`. Reads the TanStack cache first
 * (same ["profile", uid] key as useProfile) and falls back to a fetch. These
 * pre-checks are UX only — RLS remains the enforcement boundary.
 */
export async function getActionProfile(): Promise<ProfileRow | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return null;

  const cached = queryClient.getQueryData<ProfileRow | null>([
    "profile",
    userId,
  ]);
  if (cached) return cached;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = (data as ProfileRow | null) ?? null;
  queryClient.setQueryData(["profile", userId], profile);
  return profile;
}
