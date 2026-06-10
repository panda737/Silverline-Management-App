/**
 * Removes ALL demo/sample data created by scripts/seed.ts:
 * every business row (projects, tasks, clients, …) and the fake staff/client
 * auth accounts. Keeps admin@silverline.test as the bootstrap admin login and
 * keeps timeline_templates (required reference data, not demo data).
 *
 * Run with: npx tsx scripts/purge-demo-data.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const KEEP_EMAILS = new Set(["admin@silverline.test"]);

async function wipe(table: string) {
  const { error, count } = await db
    .from(table)
    .delete({ count: "exact" })
    .not("id", "is", null);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  - ${table}: removed ${count ?? 0} rows`);
}

async function main() {
  console.log("Purging demo data…");

  // Children first, parents last.
  await wipe("notifications");
  await wipe("activity_log");
  await wipe("task_comments");
  await wipe("tasks");
  await wipe("project_comments");
  await wipe("documents");
  await wipe("project_timeline_items");
  await wipe("project_members");
  await wipe("projects");
  await wipe("client_contacts");

  // Demo auth accounts (cascade deletes their profiles).
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, email");
  if (error) throw new Error(error.message);
  for (const p of profiles ?? []) {
    if (KEEP_EMAILS.has(p.email)) continue;
    const { error: delErr } = await db.auth.admin.deleteUser(p.id);
    if (delErr) throw new Error(`delete user ${p.email}: ${delErr.message}`);
    console.log(`  - removed account ${p.email}`);
  }

  await wipe("clients");

  console.log("\nDone. Remaining login: admin@silverline.test");
  console.log("Invite your real account from the Users page, then deactivate");
  console.log("or delete the bootstrap admin.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
