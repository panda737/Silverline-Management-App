import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";

/**
 * Current user's profile, or null when not signed in.
 *
 * Wrapped in React `cache()` so it runs at most ONCE per request: the layout and
 * the page both guard with requireInternal(), and without this each would repeat
 * the getUser() round-trip + profiles query. Deduped, a navigation makes one
 * auth call here instead of two+.
 */
export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
});

/** Guard for internal pages: must be an active admin or staff member. */
export async function requireInternal(): Promise<ProfileRow> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login");
  if (profile.role === "client") redirect("/portal");
  return profile;
}

/** Guard for admin-only pages. */
export async function requireAdmin(): Promise<ProfileRow> {
  const profile = await requireInternal();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

/** Guard for the client portal: must be an active client user. */
export async function requireClient(): Promise<ProfileRow> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login");
  if (profile.role !== "client") redirect("/dashboard");
  return profile;
}
