/**
 * Replace the FILE behind an existing document, keeping its version.
 *
 * Publishing normally bumps the version, because a review is pinned to the
 * version it was raised against — that is what makes a reviewer's comments
 * describe the text they actually read. This script deliberately breaks that
 * rule, so it is only correct in one narrow case:
 *
 *   the document has NO comments yet, and the change is presentational.
 *
 * That is the case it exists for: a document went out, something on the cover
 * was wrong, and nobody has marked it up yet. Bumping the version there would
 * double the reviewer's queue and orphan the reviews already sitting in it, to
 * record a change nobody had seen.
 *
 * It REFUSES to touch a document that has comments. If it refuses, publish a new
 * version instead — that is the honest answer once someone has read the thing.
 *
 *   npx tsx scripts/replace-file.ts "<file>" --project "Dilex"
 *   npx tsx scripts/replace-file.ts "<a>" "<b>" --project "Dilex" --dry-run
 *
 * Matching is by filename within the project.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, serviceKey);
const BUCKET = "project-documents";

const CONTENT_TYPES: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".pdf": "application/pdf",
  ".md": "text/markdown",
};

async function main() {
  const argv = process.argv.slice(2);
  const files: string[] = [];
  let project: string | undefined;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project") project = argv[++i];
    else if (argv[i] === "--dry-run") dryRun = true;
    else if (argv[i].startsWith("--")) {
      console.error(`Unknown flag: ${argv[i]}`);
      process.exit(1);
    } else files.push(argv[i]);
  }

  if (files.length === 0 || !project) {
    console.error('Usage: npx tsx scripts/replace-file.ts "<file>" --project "<name>" [--dry-run]');
    process.exit(1);
  }

  const { data: projects } = await db
    .from("projects")
    .select("id, name")
    .ilike("name", `%${project}%`)
    .limit(10);
  if (!projects || projects.length !== 1) {
    console.error(`"${project}" matched ${projects?.length ?? 0} projects. Be more specific.`);
    process.exit(1);
  }
  const proj = projects[0];
  console.log(`Project: ${proj.name}\n`);

  let replaced = 0;
  let skipped = 0;

  for (const path of files) {
    const name = basename(path);
    try {
      if (!statSync(path).isFile()) throw new Error("not a file");
    } catch {
      console.error(`  ✗ ${name} — not found`);
      skipped++;
      continue;
    }

    const { data: doc } = await db
      .from("documents")
      .select("id, name, version, storage_path")
      .eq("project_id", proj.id)
      .eq("name", name)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!doc) {
      console.error(`  ✗ ${name} — no such document in this project`);
      skipped++;
      continue;
    }

    // The guard. A comment means somebody has read this version and written
    // about it; the file behind it must not change underneath them.
    const { count } = await db
      .from("document_comments")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id);

    if ((count ?? 0) > 0) {
      console.error(
        `  ✗ ${name} — has ${count} comment(s). Publish a new version instead.`
      );
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  · ${name} — would replace the file behind v${doc.version}`);
      continue;
    }

    const { error } = await db.storage
      .from(BUCKET)
      .update(doc.storage_path, readFileSync(path), {
        contentType:
          CONTENT_TYPES[extname(name).toLowerCase()] ?? "application/octet-stream",
        upsert: true,
      });
    if (error) {
      console.error(`  ✗ ${name} — ${error.message}`);
      skipped++;
      continue;
    }

    console.log(`  ✓ ${name} — file replaced, still v${doc.version}`);
    replaced++;
  }

  console.log(
    dryRun
      ? "\nDry run — nothing was changed."
      : `\nReplaced ${replaced}, skipped ${skipped}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
