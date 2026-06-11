/**
 * Sets up the Dilex Inland WML Application example project to match the spec.
 * Run AFTER the WML migration is applied:
 *   npx tsx scripts/seed-dilex.ts   (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *
 * Reuses the route/stage/document/deadline definitions from src/lib/wml.ts.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  WML_STAGES,
  documentsForRoute,
  deadlinesForRoute,
} from "../src/lib/wml";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const { data: project, error: findErr } = await db
    .from("projects")
    .select("id, name")
    .ilike("name", "%dilex%")
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (!project) throw new Error("Dilex project not found — create it in the app first.");
  const projectId = project.id;
  console.log(`Found project: ${project.name} (${projectId})`);

  const route = "category_b" as const;
  const stages = WML_STAGES[route];
  const completedThrough = stages.findIndex((s) => s.key === "final_scoping_submitted");
  const currentIndex = completedThrough + 1; // authority_review_scoping
  const completedKeys = new Set(stages.slice(0, completedThrough + 1).map((s) => s.key));

  // --- Project overview ------------------------------------------------------
  const { error: upErr } = await db
    .from("projects")
    .update({
      name: "Dilex Inland WML Application",
      applicant: "Dilex Inland",
      route,
      status: "waiting_on_authority",
      current_legal_stage: "authority_review_scoping",
      current_step:
        "Waiting for authority to accept, comment on, or refuse the Final Scoping Report",
      next_action: "Await authority acceptance, comments, or refusal",
      risk_level: "high",
      risk_reason:
        "Final Scoping Report is under authority review — the statutory review clock is running and the outcome is outside our control.",
      progress: 45,
      due_date: isoOffset(28),
    })
    .eq("id", projectId);
  if (upErr) throw new Error(`project update failed: ${upErr.message}`);
  console.log("  ✓ overview updated (45%, Category B, waiting on authority)");

  // --- Regenerate timeline ---------------------------------------------------
  await db.from("project_timeline_items").delete().eq("project_id", projectId);
  const items = stages.map((s, i) => {
    const status =
      i <= completedThrough ? "completed" : i === currentIndex ? "in_progress" : "pending";
    return {
      project_id: projectId,
      stage_key: s.key,
      stage_name: s.name,
      description: s.description,
      client_visible: s.clientVisible,
      sort_order: i + 1,
      status,
      completed_date: status === "completed" ? isoOffset(-(completedThrough - i + 1) * 7) : null,
      due_date: status === "completed" ? null : isoOffset((i - currentIndex + 1) * 14),
    };
  });
  const { error: itemsErr } = await db.from("project_timeline_items").insert(items);
  if (itemsErr) throw new Error(`timeline insert failed: ${itemsErr.message}`);
  console.log(`  ✓ ${items.length} Category B timeline stages`);

  // --- Document checklist ----------------------------------------------------
  await db.from("project_document_requirements").delete().eq("project_id", projectId);
  const docs = documentsForRoute(route).map((d, i) => {
    const done = completedKeys.has(d.linkedStageKey);
    return {
      project_id: projectId,
      doc_key: d.key,
      name: d.name,
      linked_stage_key: d.linkedStageKey,
      required: d.required,
      status: done ? "approved" : "missing",
      upload_date: done ? isoOffset(-20) : null,
      sort_order: i + 1,
    };
  });
  const { error: docsErr } = await db.from("project_document_requirements").insert(docs);
  if (docsErr) throw new Error(`documents insert failed: ${docsErr.message}`);
  console.log(`  ✓ ${docs.length} document checklist items`);

  // --- Deadlines -------------------------------------------------------------
  await db.from("project_deadlines").delete().eq("project_id", projectId);
  const deadlines = deadlinesForRoute(route).map((d, i) => {
    const done = completedKeys.has(d.linkedStageKey);
    const due = done ? isoOffset(-15) : isoOffset(d.offsetDays);
    return {
      project_id: projectId,
      deadline_key: d.key,
      name: d.name,
      linked_stage_key: d.linkedStageKey,
      trigger_date: isoOffset(done ? -55 : 0),
      due_date: due,
      status: done ? "completed" : d.key === "authority_review_scoping" ? "running" : "not_started",
      sort_order: i + 1,
    };
  });
  const { error: dlErr } = await db.from("project_deadlines").insert(deadlines);
  if (dlErr) throw new Error(`deadlines insert failed: ${dlErr.message}`);
  console.log(`  ✓ ${deadlines.length} deadlines`);

  // --- Listed activities -----------------------------------------------------
  await db.from("project_listed_activities").delete().eq("project_id", projectId);
  const activities = [
    { activity_number: "B(2)", description: "Edit this description to match the applicable B(2) listed activity." },
    { activity_number: "B(3)", description: "Edit this description to match the applicable B(3) listed activity." },
    { activity_number: "B(4)", description: "Edit this description to match the applicable B(4) listed activity." },
    { activity_number: "B(10)", description: "Edit this description to match the applicable B(10) listed activity." },
  ].map((a, i) => ({
    project_id: projectId,
    activity_number: a.activity_number,
    category: "Category B",
    description: a.description,
    triggered: "yes",
    sort_order: i + 1,
  }));
  const { error: actErr } = await db.from("project_listed_activities").insert(activities);
  if (actErr) throw new Error(`activities insert failed: ${actErr.message}`);
  console.log(`  ✓ ${activities.length} listed activities (B(2), B(3), B(4), B(10))`);

  console.log("\nDilex Inland WML Application is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
