# Silverline Management Portal

Internal project-management system plus client-facing portal for an
environmental compliance consultancy. Built with Next.js 15 (App Router),
TypeScript (strict), Tailwind CSS + shadcn/ui, and Supabase (Postgres, Auth,
Storage, RLS).

## Architecture notes

- **Security lives in the database.** Every table has RLS. Internal users
  (admin/staff) read base tables; client users get **zero rows** from base
  tables and read only through the `portal_*` views, which expose exactly the
  client-safe columns and rows for their own company. This prevents
  internal-only columns (`projects.description`, `internal_notes`, …) from
  ever being selectable by a client.
- **Roles** (`admin` / `staff` / `client`) live on `profiles`, auto-created by
  a DB trigger when an auth user is created. Role and company are read only
  from `app_metadata` (admin-controlled) — never from user-editable
  `user_metadata`.
- **Project progress** is computed by a DB trigger from timeline items
  (completed ÷ non-skipped) — never hand-entered.
- **Documents** (Phase 3) go in the private `project-documents` bucket with
  storage policies mirroring the `documents` table; downloads only via
  short-lived signed URLs.
- Every mutation goes through a server action that re-checks the caller's
  role before touching data.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key,
   and service-role key (Project Settings → API).
3. Apply migrations (`supabase/migrations/*.sql`), either:
   - `npx supabase link --project-ref <ref> && npx supabase db push`, or
   - if the Supabase CLI cannot run on your machine (e.g. Windows App Control
     blocks its binary):
     `SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migrations.mjs <ref>`
     (personal access token from supabase.com/dashboard/account/tokens).
4. The app starts empty. Sign in as the bootstrap admin, invite your real
   account from the Users page, then deactivate the bootstrap admin.
   Optional **demo data** (sample client, projects, tasks, test users) can be
   loaded with `npm run seed:demo` and removed again with
   `npx tsx scripts/purge-demo-data.ts`.
5. Supabase dashboard auth configuration (one-time, not schema):
   - Authentication → URL Configuration: set **Site URL** to your app URL and
     add `http://localhost:3000/**` (and the production URL) to
     **Redirect URLs** — required for the email invite flow.
   - Authentication → Sign In / Up: **disable public sign-ups**. Accounts are
     invite-only via the Users page.
6. `npm run dev`

## Logins

Bootstrap admin: `admin@silverline.test` / `Password123!` — change or replace
this account before going to production. Running `npm run seed:demo` adds demo
accounts (staff1/staff2@silverline.test, client1/client2@vaalrecyclers.test,
same password).

## Scripts

- `npm run dev` / `npm run build` / `npm start`
- `npm run typecheck` — `tsc --noEmit`
- `npm run seed:demo` — OPTIONAL demo data (sample client, projects, tasks,
  test users); remove again with `npx tsx scripts/purge-demo-data.ts`
- `npx tsx scripts/rls-smoke-test.ts` — signs in as seed users with the anon
  key and verifies clients cannot read internal data
- `node scripts/apply-migrations.mjs <ref>` — apply migrations via the
  Supabase Management API (needs `SUPABASE_ACCESS_TOKEN`)
- `node scripts/db-query.mjs "<sql>" | --file x.sql` — ad-hoc SQL via the
  Management API (needs `SUPABASE_ACCESS_TOKEN`)

## Build phases

- **Phase 1 (done):** schema + RLS + storage policies, seed, auth (login,
  invite flow, middleware, role routing), app shell, Projects (list / create
  with template-generated timeline / detail), internal dashboard, minimal
  client portal dashboard.
- **Phase 2:** Clients module, full project detail tabs (timeline editing,
  tasks), global tasks view with filters.
- **Phase 3:** Documents (signed URLs), comments/updates, full client portal,
  Client View Preview, RLS verification pass.
- **Phase 4:** Reports (charts), activity log + notifications, deadlines
  view, polish.
