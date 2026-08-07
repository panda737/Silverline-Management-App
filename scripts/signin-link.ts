/**
 * Print a one-time sign-in link for a user WITHOUT emailing them.
 *
 * Two uses:
 *   1. Testing — walk the exact flow the person will get, without sending them
 *      anything, and without inventing a password that then has to be cleaned up.
 *   2. Hand-delivery — when you want to give someone their first link over
 *      WhatsApp or in person rather than trusting mail to arrive.
 *
 *   npx tsx scripts/signin-link.ts info@inyathiconsult.co.za
 *   npx tsx scripts/signin-link.ts info@inyathiconsult.co.za https://www.silverline-management.co.za
 *
 * The link signs you in AS that person: anything done with it is recorded as
 * them. It is single-use and expires — treat it like a key, not a URL.
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
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const email = process.argv[2];
  const redirectTo = process.argv[3] ?? "http://localhost:3000";

  if (!email) {
    console.error("Usage: npx tsx scripts/signin-link.ts <email> [redirect-url]");
    process.exit(1);
  }

  const { data: profile } = await db
    .from("profiles")
    .select("full_name, email, role, active")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    console.error(`No portal account for ${email}. Create one first with create-staff-user.ts.`);
    process.exit(1);
  }
  if (!profile.active) {
    console.error(`${email} exists but is deactivated — the link would bounce at the guard.`);
    process.exit(1);
  }

  const { data, error } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error || !data.properties?.action_link) {
    console.error(`Could not generate a link: ${error?.message}`);
    process.exit(1);
  }

  console.log("");
  console.log(`  ${profile.full_name}  <${profile.email}>  role=${profile.role}`);
  console.log("");

  // Supabase validates redirect_to against the project's allowlist and silently
  // falls back to the Site URL when it does not match — which makes the hosted
  // link useless for local testing. The app's own /auth/confirm route calls
  // verifyOtp() with the hashed token client-side, so this second form skips
  // the redirect allowlist entirely and lands wherever you point it.
  const hashed = data.properties.hashed_token;
  const base = redirectTo.replace(/\/+$/, "");
  console.log(`  Direct — opens on ${base}:`);
  console.log("");
  console.log(`  ${base}/auth/confirm?token_hash=${hashed}&type=magiclink`);
  console.log("");
  console.log("  Hosted — obeys the Supabase Redirect URL allowlist:");
  console.log("");
  console.log(`  ${data.properties.action_link}`);
  console.log("");
  console.log("  Single use. Signs you in AS them — sign out afterwards.");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
