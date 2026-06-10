/**
 * Run an ad-hoc SQL query against the linked project via the Management API.
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/db-query.mjs "select 1"
 */
import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF ?? "vdycgxxdirscvnrqiizg";
let query = process.argv[2];
if (query === "--file") {
  query = readFileSync(process.argv[3], "utf8");
}
if (!token || !query) {
  console.error("Usage: SUPABASE_ACCESS_TOKEN=... node scripts/db-query.mjs <sql | --file path>");
  process.exit(1);
}

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
console.log(res.status);
console.log(text);
