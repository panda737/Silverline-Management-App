/**
 * Promote (or change) a user's role by email.
 *
 * Sets user_role in auth app_metadata (the admin-controlled source of truth,
 * which cascades into public.profiles via the sync_user_metadata trigger),
 * then verifies the profiles row. For non-client roles it also clears client_id.
 *
 * Usage: tsx scripts/promote-user.ts <email> <admin|staff|client>
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.argv[2];
const role = process.argv[3] as "admin" | "staff" | "client";

if (!email || !["admin", "staff", "client"].includes(role)) {
  console.error("Usage: tsx scripts/promote-user.ts <email> <admin|staff|client>");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Find the profile (and thus the auth user id) by email.
  const { data: profile, error: findErr } = await admin
    .from("profiles")
    .select("id, email, role, client_id")
    .eq("email", email)
    .maybeSingle();

  if (findErr) throw findErr;
  if (!profile) {
    console.error(`No profile found for ${email}`);
    process.exit(1);
  }

  console.log(`Found ${profile.email} (id ${profile.id}) — current role: ${profile.role}`);

  // 1. Durable source of truth: app_metadata. Trigger syncs role -> profiles.
  const { error: metaErr } = await admin.auth.admin.updateUserById(profile.id, {
    app_metadata: { user_role: role, client_id: role === "client" ? profile.client_id : null },
  });
  if (metaErr) throw metaErr;

  // 2. The sync trigger coalesces client_id (won't null it), so clear it here
  //    for non-client roles to keep the row clean.
  if (role !== "client") {
    const { error: clearErr } = await admin
      .from("profiles")
      .update({ role, client_id: null })
      .eq("id", profile.id);
    if (clearErr) throw clearErr;
  }

  // Verify.
  const { data: after, error: afterErr } = await admin
    .from("profiles")
    .select("email, role, client_id, active")
    .eq("id", profile.id)
    .single();
  if (afterErr) throw afterErr;

  console.log("Done. Profile now:", after);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
