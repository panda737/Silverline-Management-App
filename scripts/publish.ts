/**
 * Publish a finished document from the working repo into the portal.
 *
 * The split this enforces: the git repo (dev/silverline-projects) is the
 * workshop, where agents and people actually write. The portal is the shopfront,
 * where a document gets read, commented on and signed off. Publishing is a
 * deliberate ONE-WAY event, not a sync — a review must point at a frozen
 * artifact, so if the repo copy moves on afterwards the reviewer's comments
 * still describe what they actually read.
 *
 * Usage:
 *
 *   npx tsx scripts/publish.ts "<file>" --project "Elandsfontein"
 *   npx tsx scripts/publish.ts "<file>" --project dilex --review lucas --note "Ch 1-5 for your review"
 *   npx tsx scripts/publish.ts "<a>" "<b>" "<c>" --project dilex --review lucas   # one batch
 *
 * Flags:
 *   --project <name|id>   Required. Matched case-insensitively on project name.
 *   --review  <name|email> Send to this person for review (one batch for all files).
 *   --note    <text>      Note carried on the review batch.
 *   --folder  <name>      File into this project folder.
 *   --type    <doc_type>  Defaults to 'draft_report'. Must be a doc_type enum
 *                         member: application · audit_report · draft_report ·
 *                         final_report · ppp_document · authority_correspondence ·
 *                         client_information · licence_approval ·
 *                         supporting_document · other
 *   --dry-run             Say what would happen; change nothing.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
const db = createClient(url, serviceKey);

const BUCKET = "project-documents";

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

type Args = {
  files: string[];
  project?: string;
  review?: string;
  note?: string;
  folder?: string;
  type: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  // Must be a member of the doc_type enum — the DB rejects anything else, and a
  // dry run cannot catch it because it never reaches the insert.
  const out: Args = { files: [], type: "draft_report", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--project") out.project = argv[++i];
    else if (a === "--review") out.review = argv[++i];
    else if (a === "--note") out.note = argv[++i];
    else if (a === "--folder") out.folder = argv[++i];
    else if (a === "--type") out.type = argv[++i];
    else if (a.startsWith("--")) {
      console.error(`Unknown flag: ${a}`);
      process.exit(1);
    } else out.files.push(a);
  }
  return out;
}

const CONTENT_TYPES: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".pdf": "application/pdf",
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

async function resolveProject(needle: string) {
  const { data: byId } = await db
    .from("projects")
    .select("id, name")
    .eq("id", needle)
    .maybeSingle();
  if (byId) return byId;

  const { data } = await db
    .from("projects")
    .select("id, name")
    .ilike("name", `%${needle}%`)
    .limit(10);
  if (!data || data.length === 0) return null;
  if (data.length > 1) {
    console.error(`"${needle}" matches ${data.length} projects:`);
    data.forEach((p) => console.error(`  - ${p.name}`));
    console.error("Be more specific, or pass the project id.");
    process.exit(1);
  }
  return data[0];
}

async function resolveReviewer(needle: string) {
  const { data } = await db
    .from("profiles")
    .select("id, full_name, email, role, active")
    .neq("role", "client")
    .eq("active", true)
    .or(`full_name.ilike.%${needle}%,email.ilike.%${needle}%`)
    .limit(10);
  if (!data || data.length === 0) return null;
  if (data.length > 1) {
    console.error(`"${needle}" matches ${data.length} people:`);
    data.forEach((p) => console.error(`  - ${p.full_name} <${p.email}>`));
    process.exit(1);
  }
  return data[0];
}

async function resolveFolder(projectId: string, name: string) {
  const { data } = await db
    .from("project_folders")
    .select("id, name")
    .eq("project_id", projectId)
    .ilike("name", `%${name}%`)
    .limit(1);
  return data?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.files.length === 0 || !args.project) {
    console.error(
      'Usage: npx tsx scripts/publish.ts "<file>" --project "<name>" [--review <person>] [--note "…"]'
    );
    process.exit(1);
  }

  const project = await resolveProject(args.project);
  if (!project) {
    console.error(`No project matched "${args.project}".`);
    process.exit(1);
  }

  const reviewer = args.review ? await resolveReviewer(args.review) : null;
  if (args.review && !reviewer) {
    console.error(`No internal user matched "${args.review}".`);
    process.exit(1);
  }

  const folder = args.folder
    ? await resolveFolder(project.id, args.folder)
    : null;
  if (args.folder && !folder) {
    console.warn(`No folder matched "${args.folder}" — filing at project root.`);
  }

  console.log(`Project:  ${project.name}`);
  if (reviewer) console.log(`Reviewer: ${reviewer.full_name} <${reviewer.email}>`);
  if (folder) console.log(`Folder:   ${folder.name}`);
  console.log("");

  const publishedIds: string[] = [];

  for (const path of args.files) {
    let stat;
    try {
      stat = statSync(path);
    } catch {
      console.error(`  ✗ ${path} — not found`);
      continue;
    }
    if (!stat.isFile()) {
      console.error(`  ✗ ${path} — not a file`);
      continue;
    }

    const name = basename(path);
    const ext = extname(name).toLowerCase();

    // A document with the same name in the same project is a NEW VERSION, not a
    // duplicate. Existing reviews stay pinned to the version they were raised
    // against, which is the whole point of freezing them.
    const { data: existing } = await db
      .from("documents")
      .select("id, version")
      .eq("project_id", project.id)
      .eq("name", name)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const version = existing ? existing.version + 1 : 1;

    if (args.dryRun) {
      console.log(
        `  · ${name} — would publish as v${version}${existing ? " (supersedes existing)" : ""}`
      );
      continue;
    }

    const safeName = name.replace(/[^\w.\- ()]/g, "_");
    const storagePath = `${project.id}/${randomUUID()}-${safeName}`;

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, readFileSync(path), {
        contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
      });
    if (uploadError) {
      console.error(`  ✗ ${name} — upload failed: ${uploadError.message}`);
      continue;
    }

    const { data: inserted, error: insertError } = await db
      .from("documents")
      .insert({
        project_id: project.id,
        name,
        doc_type: args.type,
        storage_path: storagePath,
        version,
        folder_id: folder?.id ?? null,
        client_visible: false,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error(`  ✗ ${name} — ${insertError?.message}`);
      continue;
    }

    publishedIds.push(inserted.id);
    console.log(`  ✓ ${name} — v${version}`);
  }

  if (args.dryRun) {
    console.log("\nDry run — nothing was changed.");
    return;
  }

  if (publishedIds.length === 0) {
    console.log("\nNothing published.");
    return;
  }

  // One batch for the whole publish, so the reviewer gets one notification.
  if (reviewer) {
    const { data: batch, error: batchError } = await db
      .from("review_batches")
      .insert({ reviewer_id: reviewer.id, note: args.note ?? null })
      .select("id")
      .single();
    if (batchError || !batch) {
      console.error(`\nPublished, but could not create the review batch: ${batchError?.message}`);
      return;
    }

    const { data: docs } = await db
      .from("documents")
      .select("id, version")
      .in("id", publishedIds);

    const { error } = await db.from("document_reviews").upsert(
      (docs ?? []).map((d) => ({
        document_id: d.id,
        document_version: d.version,
        reviewer_id: reviewer.id,
        batch_id: batch.id,
      })),
      { onConflict: "document_id,document_version,reviewer_id", ignoreDuplicates: true }
    );
    if (error) {
      console.error(`\nPublished, but could not assign the review: ${error.message}`);
      return;
    }

    console.log(
      `\nSent ${publishedIds.length} document${publishedIds.length === 1 ? "" : "s"} to ${reviewer.full_name} for review.`
    );
    console.log(
      "Notify them with:  npx tsx scripts/notify-reviewer.ts " + batch.id
    );
  } else {
    console.log(`\nPublished ${publishedIds.length} document(s).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
