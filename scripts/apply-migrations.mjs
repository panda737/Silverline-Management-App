/**
 * Applies supabase/migrations/*.sql to the linked project via the Supabase
 * Management API. Used when the Supabase CLI cannot run locally.
 *
 * Usage:  SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migrations.mjs [project-ref]
 * Records applied versions in supabase_migrations.schema_migrations so a
 * future `supabase db push` stays in sync.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.argv[2] ?? "vdycgxxdirscvnrqiizg";
if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

async function runQuery(query, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${label} failed (${res.status}): ${text}`);
  }
  console.log(`  ✓ ${label}`);
}

const dir = path.resolve("supabase/migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

// Skip migrations already recorded remotely.
let applied = new Set();
try {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "select version from supabase_migrations.schema_migrations",
      }),
    }
  );
  if (res.ok) {
    const rows = await res.json();
    applied = new Set(rows.map((r) => r.version));
  }
} catch {
  // schema_migrations does not exist yet — nothing applied.
}

for (const file of files) {
  const version = file.split("_")[0];
  const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");
  if (applied.has(version)) {
    console.log(`  = already applied: ${file}`);
    continue;
  }
  console.log(`Applying ${file}…`);
  const sql = await readFile(path.join(dir, file), "utf8");
  await runQuery(sql, file);
  await runQuery(
    `create schema if not exists supabase_migrations;
     create table if not exists supabase_migrations.schema_migrations (
       version text primary key, statements text[], name text
     );
     insert into supabase_migrations.schema_migrations (version, name)
     values ('${version}', '${name}') on conflict (version) do nothing;`,
    `record ${version}`
  );
}

console.log("All migrations applied.");
