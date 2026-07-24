/**
 * Bulk document importer — gets years of existing files off OneDrive and into
 * the portal, filed correctly, without anyone clicking Upload 187 times.
 *
 * Two steps, on purpose: the machine guesses, a human checks, then it runs.
 *
 *   1. SCAN — walk a source folder and write a CSV manifest with a suggested
 *      project / folder / subfolder / type for every file:
 *
 *        npx tsx scripts/import-documents.ts scan "C:\\path\\to\\Silverline" \
 *          --out import-manifest.csv
 *
 *   2. Open the CSV (Excel works fine), fix anything wrong, set `skip` to y on
 *      rows you don't want, then:
 *
 *        npx tsx scripts/import-documents.ts import import-manifest.csv --dry-run
 *        npx tsx scripts/import-documents.ts import import-manifest.csv
 *
 * Import is idempotent: a file already present in the same project+folder with
 * the same name and size is skipped, so re-running after a fix is safe.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BUCKET = "project-documents";

/** Files we never want in the portal. */
const IGNORE_NAMES = [/^~\$/, /^~WRL/, /^desktop\.ini$/i, /^\.DS_Store$/i];
const IGNORE_EXTS = new Set([".tmp", ".lnk", ".ini", ".url", ".db"]);

/** Standard folder names — must match the seeded set in the migration. */
const FOLDER = {
  proposals: "Proposals & Quotes",
  clientInfo: "Client Information",
  application: "Application & Reports",
  specialist: "Specialist Studies",
  ppp: "Public Participation",
  submissions: "Submissions to Authority",
  correspondence: "Authority Correspondence",
  decisions: "Decisions & Licences",
  audits: "Audits & Monitoring",
  invoices: "Invoices & Admin",
  general: "General",
} as const;

/**
 * Keyword → folder, checked against the full relative path (folder names and
 * filename together). First match wins, so order matters: the most specific
 * signals sit at the top.
 */
const RULES: { pattern: RegExp; folder: string; docType: string }[] = [
  { pattern: /\b(proposal|quotation|quote|tender|pricing)\b/i, folder: FOLDER.proposals, docType: "other" },
  { pattern: /\b(invoice|purchase order|\bpo\b|contract|sla)\b/i, folder: FOLDER.invoices, docType: "other" },
  { pattern: /\b(licen[cs]e|permit|authorisation|authorization|approval|decision|amendment)\b/i, folder: FOLDER.decisions, docType: "licence_approval" },
  { pattern: /\b(audit|monitoring|compliance report)\b/i, folder: FOLDER.audits, docType: "audit_report" },
  { pattern: /\b(notice|advert|newspaper|stakeholder|bid\b|i&ap|public participation|ppp|comment|register of)\b/i, folder: FOLDER.ppp, docType: "ppp_document" },
  { pattern: /\b(submission|submitted|cover letter|transmittal)\b/i, folder: FOLDER.submissions, docType: "application" },
  { pattern: /\b(correspondence|acknowledge|rfi|query|letter from|response to)\b/i, folder: FOLDER.correspondence, docType: "authority_correspondence" },
  { pattern: /\b(specialist|ecolog|biodiversity|hydro|geotech|geohydro|heritage|traffic|air quality|noise|soil|flora|fauna|wetland)\b/i, folder: FOLDER.specialist, docType: "supporting_document" },
  { pattern: /\b(scoping|eia|empr|emp\b|application|draft|final report|report)\b/i, folder: FOLDER.application, docType: "draft_report" },
  { pattern: /\b(sop|procedure|process flow|work instruction|\bwi\b|site plan|layout|certificate|company|registration doc)\b/i, folder: FOLDER.clientInfo, docType: "client_information" },
];

/**
 * Top-level source directory → project name. Explicit beats clever: the folder
 * names on disk are client shorthand ("Elandsfontein EIA Dialex") while project
 * names are engagement-scoped ("Dilex Inland WML Application"), and no fuzzy
 * matcher gets that right reliably. Anything not listed here falls back to a
 * loose word match, and unmatched rows come out blank for a human to fill.
 */
const DIR_PROJECT_MAP: Record<string, string> = {
  "Elandsfontein EIA Dialex": "Dilex Inland WML Application",
  "Spill Tech": "Spill Tech - Norms & Standards Application Gauteng",
  "ClinX Waste Management": "ClinX – DFFE Reporting & AEL Compliance",
  "Tshenolo Waste": "Tshenolo – Norms & Standards Registration",
  Hillside: "Hillside Complex – Section 24G Fine Appeal",
};

/**
 * Source directories that aren't project records — pre-marked skip=y in the
 * manifest so they're excluded unless someone deliberately un-skips them.
 */
const DEFAULT_SKIP_DIRS = new Set(["Templates", "make.com"]);

/** Source directory names that clearly mean "this is one submission event". */
const SUBFOLDER_HINTS = [
  { pattern: /submission[\s_-]*pack[\s_-]*(\d+)/i, folder: FOLDER.submissions, name: (m: RegExpMatchArray) => `Submission Pack ${m[1]}` },
  { pattern: /submission[\s_-]*(\d+)/i, folder: FOLDER.submissions, name: (m: RegExpMatchArray) => `Submission ${m[1]}` },
];

// ---------------------------------------------------------------------------
// CSV helpers (quote everything; Excel-friendly)
// ---------------------------------------------------------------------------

const COLUMNS = [
  "skip",
  "project",
  "folder",
  "subfolder",
  "doc_type",
  "client_visible",
  "file_name",
  "source_path",
] as const;
type Row = Record<(typeof COLUMNS)[number], string>;

const csvEscape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

function toCsv(rows: Row[]): string {
  const head = COLUMNS.map(csvEscape).join(",");
  const body = rows.map((r) => COLUMNS.map((c) => csvEscape(r[c] ?? "")).join(","));
  return [head, ...body].join("\r\n") + "\r\n";
}

function parseCsv(text: string): Row[] {
  const cells: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      cells.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field || row.length) {
    row.push(field);
    cells.push(row);
  }
  const [header, ...rest] = cells.filter((r) => r.some((c) => c.trim()));
  return rest.map((cols) => {
    const out = {} as Row;
    header.forEach((h, i) => {
      out[h.trim() as keyof Row] = (cols[i] ?? "").trim();
    });
    return out;
  });
}

// ---------------------------------------------------------------------------
// SCAN
// ---------------------------------------------------------------------------

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(full, out);
    } else if (entry.isFile()) {
      if (IGNORE_NAMES.some((re) => re.test(entry.name))) continue;
      if (IGNORE_EXTS.has(extname(entry.name).toLowerCase())) continue;
      out.push(full);
    }
  }
  return out;
}

function classify(relPath: string): { folder: string; docType: string } {
  // Drop the top-level directory: it's the client/site name and every file
  // under it would inherit whatever keywords it happens to contain (a folder
  // called "Elandsfontein EIA Dialex" would file all 96 files as EIA reports).
  const withoutTopDir = relPath.split(sep).slice(1).join(sep) || relPath;
  const haystack = withoutTopDir.replace(/[_\-]+/g, " ");
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) {
      return { folder: rule.folder, docType: rule.docType };
    }
  }
  return { folder: FOLDER.general, docType: "other" };
}

function detectSubfolder(relPath: string, folder: string): string {
  for (const segment of relPath.split(sep).slice(0, -1)) {
    for (const hint of SUBFOLDER_HINTS) {
      const match = segment.match(hint.pattern);
      if (match && hint.folder === folder) return hint.name(match);
    }
  }
  return "";
}

/** Loose match of a source directory name to a project name. */
/** Words that appear in half the project names and identify nothing. */
const GENERIC_WORDS = new Set([
  "waste", "management", "licence", "license", "application", "registration",
  "norms", "standards", "section", "response", "compliance", "reporting",
  "facility", "project", "gauteng", "complex", "appeal", "fine", "hazardous",
  "dffe", "inland", "documents",
]);

function matchProject(
  dirName: string,
  projects: { id: string; name: string }[]
): string {
  if (DIR_PROJECT_MAP[dirName]) return DIR_PROJECT_MAP[dirName];

  const distinctive = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((w) => w.length > 3 && !GENERIC_WORDS.has(w))
    );

  const target = distinctive(dirName);
  if (target.size === 0) return "";

  let best = "";
  let bestHits = 0;
  for (const project of projects) {
    const hits = [...distinctive(project.name)].filter((w) =>
      target.has(w)
    ).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = project.name;
    }
  }
  return bestHits > 0 ? best : "";
}

async function scan(sourceDir: string, outPath: string) {
  const { data: projects, error } = await db
    .from("projects")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);

  const files = walk(sourceDir);
  const rows: Row[] = files.map((full) => {
    const rel = relative(sourceDir, full);
    const topDir = rel.split(sep)[0];
    const { folder, docType } = classify(rel);
    return {
      skip: DEFAULT_SKIP_DIRS.has(topDir) ? "y" : "",
      project: matchProject(topDir, projects ?? []),
      folder,
      subfolder: detectSubfolder(rel, folder),
      doc_type: docType,
      client_visible: "",
      file_name: basename(full),
      source_path: full,
    };
  });

  rows.sort(
    (a, b) =>
      a.project.localeCompare(b.project) ||
      a.folder.localeCompare(b.folder) ||
      a.file_name.localeCompare(b.file_name)
  );

  writeFileSync(outPath, toCsv(rows), "utf8");

  const unmatched = rows.filter((r) => !r.project).length;
  console.log(`Scanned ${files.length} files from ${sourceDir}`);
  console.log(`Wrote ${outPath}`);
  console.log(
    `${rows.length - unmatched} rows matched a project, ${unmatched} need a project filled in.`
  );
  console.log("\nProjects available (copy these names exactly):");
  for (const p of projects ?? []) console.log(`  ${p.name}`);
}

// ---------------------------------------------------------------------------
// IMPORT
// ---------------------------------------------------------------------------

async function getFolderId(
  projectId: string,
  folderName: string,
  subfolderName: string,
  cache: Map<string, string>,
  dryRun: boolean
): Promise<string | null> {
  if (!folderName) return null;
  const key = `${projectId}|${folderName}|${subfolderName}`;
  if (cache.has(key)) return cache.get(key)!;

  const findOrCreate = async (name: string, parentId: string | null) => {
    const base = db
      .from("project_folders")
      .select("id")
      .eq("project_id", projectId)
      .ilike("name", name);
    const { data: existing } = await (parentId
      ? base.eq("parent_id", parentId)
      : base.is("parent_id", null)
    ).maybeSingle();
    if (existing) return existing.id as string;

    if (dryRun) return `(would create folder "${name}")`;
    const { data: created, error } = await db
      .from("project_folders")
      .insert({ project_id: projectId, name, parent_id: parentId, sort_order: 500 })
      .select("id")
      .single();
    if (error) throw new Error(`Could not create folder "${name}": ${error.message}`);
    return created.id as string;
  };

  const rootId = await findOrCreate(folderName, null);
  const finalId = subfolderName
    ? await findOrCreate(subfolderName, rootId)
    : rootId;
  cache.set(key, finalId);
  return finalId;
}

async function importManifest(csvPath: string, dryRun: boolean) {
  const rows = parseCsv(readFileSync(csvPath, "utf8"));

  const { data: projects, error: projectError } = await db
    .from("projects")
    .select("id, name");
  if (projectError) throw new Error(projectError.message);
  const projectByName = new Map(
    (projects ?? []).map((p) => [p.name.toLowerCase(), p.id as string])
  );

  const folderCache = new Map<string, string>();
  let imported = 0;
  let skipped = 0;
  const problems: string[] = [];

  for (const row of rows) {
    const label = row.file_name || row.source_path;
    if (row.skip.toLowerCase().startsWith("y")) {
      skipped++;
      continue;
    }
    const projectId = projectByName.get(row.project.trim().toLowerCase());
    if (!projectId) {
      problems.push(`${label}: no project named "${row.project}"`);
      continue;
    }

    let size = 0;
    try {
      size = statSync(row.source_path).size;
    } catch {
      problems.push(`${label}: file not found at ${row.source_path}`);
      continue;
    }

    const folderId = await getFolderId(
      projectId,
      row.folder.trim(),
      row.subfolder.trim(),
      folderCache,
      dryRun
    );

    // Idempotency: same project + same name already there → leave it alone.
    const { data: existing } = await db
      .from("documents")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", row.file_name)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(
        `WOULD IMPORT  ${row.project} / ${row.folder}${row.subfolder ? " / " + row.subfolder : ""} / ${row.file_name} (${(size / 1024).toFixed(0)} KB)`
      );
      imported++;
      continue;
    }

    const safeName = row.file_name.replace(/[^\w.\- ()]/g, "_");
    const storagePath = `${projectId}/${crypto.randomUUID()}-${safeName}`;
    const bytes = readFileSync(row.source_path);

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      problems.push(`${label}: upload failed — ${uploadError.message}`);
      continue;
    }

    const { error: insertError } = await db.from("documents").insert({
      project_id: projectId,
      name: row.file_name,
      doc_type: row.doc_type || "other",
      storage_path: storagePath,
      folder_id: folderId,
      client_visible: row.client_visible.toLowerCase().startsWith("y"),
      notes: `Imported from ${row.source_path}`,
    });
    if (insertError) {
      await db.storage.from(BUCKET).remove([storagePath]);
      problems.push(`${label}: row insert failed — ${insertError.message}`);
      continue;
    }

    imported++;
    console.log(`imported  ${row.project} / ${row.folder} / ${row.file_name}`);
  }

  console.log(
    `\n${dryRun ? "DRY RUN — nothing was written.\n" : ""}${imported} imported, ${skipped} skipped, ${problems.length} problems.`
  );
  for (const problem of problems) console.log(`  ! ${problem}`);
}

// ---------------------------------------------------------------------------

const [mode, arg, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(name);
  return i === -1 ? undefined : rest[i + 1];
};

if (mode === "scan" && arg) {
  await scan(arg, flag("--out") ?? "import-manifest.csv");
} else if (mode === "import" && arg) {
  await importManifest(arg, rest.includes("--dry-run"));
} else {
  console.log(`Usage:
  npx tsx scripts/import-documents.ts scan <source-dir> [--out manifest.csv]
  npx tsx scripts/import-documents.ts import <manifest.csv> [--dry-run]`);
  process.exit(1);
}
