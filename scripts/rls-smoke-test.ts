/**
 * RLS smoke test: signs in as seed users with the ANON key (same as the
 * browser) and verifies what each role can see.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let failures = 0;

function check(label: string, ok: boolean, extra = "") {
  console.log(`${ok ? "  ✓" : "  ✗ FAIL"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failures++;
}

async function run() {
  // --- client user ---------------------------------------------------------
  console.log("As client1@vaalrecyclers.test:");
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: "client1@vaalrecyclers.test",
    password: "Password123!",
  });
  check("can sign in", !signInErr, signInErr?.message);

  const { data: baseProjects } = await client.from("projects").select("id");
  check("base projects table returns 0 rows", (baseProjects ?? []).length === 0);

  const { data: baseTasks } = await client.from("tasks").select("id");
  check("tasks table returns 0 rows", (baseTasks ?? []).length === 0);

  const { data: baseClients } = await client.from("clients").select("notes");
  check("clients table (internal notes) returns 0 rows", (baseClients ?? []).length === 0);

  const { data: baseComments } = await client.from("project_comments").select("id");
  check("project_comments table returns 0 rows", (baseComments ?? []).length === 0);

  const { data: portalProjects } = await client.from("portal_projects").select("*");
  check("portal_projects returns own projects", (portalProjects ?? []).length === 2);
  const cols = portalProjects?.[0] ? Object.keys(portalProjects[0]) : [];
  check(
    "portal_projects has no internal 'description' column",
    !cols.includes("description")
  );

  const { data: portalStages } = await client.from("portal_timeline_items").select("*");
  check(
    "portal_timeline_items only client_visible stages",
    (portalStages ?? []).length > 0 &&
      !(portalStages?.[0] && "internal_notes" in portalStages[0])
  );

  const { data: portalUpdates } = await client.from("portal_updates").select("body");
  check("portal_updates shows exactly 1 client-visible update", (portalUpdates ?? []).length === 1);
  check(
    "internal note text not present in updates",
    !(portalUpdates ?? []).some((u) => u.body.includes("authority case officer"))
  );
  await client.auth.signOut();

  // --- staff user -----------------------------------------------------------
  console.log("As staff1@silverline.test:");
  const staff = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: staffErr } = await staff.auth.signInWithPassword({
    email: "staff1@silverline.test",
    password: "Password123!",
  });
  check("can sign in", !staffErr, staffErr?.message);

  const { data: staffProjects } = await staff.from("projects").select("id");
  check("sees all projects", (staffProjects ?? []).length === 2);

  const { data: staffTasks } = await staff.from("tasks").select("id");
  check("sees all tasks", (staffTasks ?? []).length === 5);

  const { data: tpl } = await staff.from("timeline_templates").select("id");
  check("sees timeline templates", (tpl ?? []).length > 30);
  await staff.auth.signOut();

  console.log(failures === 0 ? "\nALL RLS CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
