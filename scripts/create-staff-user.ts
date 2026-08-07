/**
 * Create an internal (staff/admin) account without emailing anyone yet.
 *
 * The portal's normal path is the invite-user edge function, which sends a
 * GoTrue invite immediately. That is wrong when the account has to exist BEFORE
 * the person is told about it — magic-link sign-in uses `shouldCreateUser:
 * false`, so the row must be there first, but you do not want them clicking in
 * before the feature they were invited for is live.
 *
 * This creates the user with the email pre-confirmed and sends nothing. Notify
 * them later with scripts/notify-reviewer.ts, or a plain magic link.
 *
 *   npx tsx scripts/create-staff-user.ts "info@inyathiconsult.co.za" "Lucas Mahlangu" staff
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const [email, fullName, roleArg] = process.argv.slice(2);
  const role = roleArg ?? "staff";

  if (!email || !fullName) {
    console.error(
      'Usage: npx tsx scripts/create-staff-user.ts <email> "<Full Name>" [staff|admin]'
    );
    process.exit(1);
  }
  if (role !== "staff" && role !== "admin") {
    console.error("Role must be staff or admin (client accounts need a company).");
    process.exit(1);
  }

  const { data: existing } = await db
    .from("profiles")
    .select("id, email, role, active")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    console.log(`Already exists: ${existing.email} (${existing.role})`);
    return;
  }

  // user_role in app_metadata is the admin-controlled source of truth that
  // handle_new_user() reads; full_name comes from user_metadata.
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { user_role: role },
    user_metadata: { full_name: fullName, user_role: role },
  });

  if (error || !data.user) {
    console.error(`Could not create the account: ${error?.message}`);
    process.exit(1);
  }

  // The trigger fires on insert; confirm it landed with the right role rather
  // than assuming it did.
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, email, role, active")
    .eq("id", data.user.id)
    .maybeSingle();

  console.log("Created:");
  console.log(`  ${profile?.email}  ${profile?.full_name}  role=${profile?.role}  active=${profile?.active}`);
  console.log("\nNo email was sent. They can now use 'Email me a sign-in link'.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
