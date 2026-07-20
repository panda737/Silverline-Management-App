# Silverline Management App — Claude guide

Project-tracking portal for [[Silverline]] (environmental compliance consultancy) —
cross-project progress, "what's next" per engagement, and a client portal where
clients see only their own project's progress.

**Stack (since 2026-07-19, `vite-spa` rebuild):** Vite 7 + React 19 + TypeScript SPA ·
react-router-dom 7 · TanStack Query 5 · Supabase (`supabase-js`, browser client —
**security lives entirely in RLS**; clients read only the `portal_*` views) ·
Tailwind 4 · shadcn/radix-ui ("radix-nova" style — copy `src/components/ui/*`
verbatim, never regenerate) · Zod.

Was Next.js 15 SSR; rebuilt as a SPA because every SSR navigation paid
SA→US function + serial Supabase round-trips (~1s/click in prod). Client-side
navigation is instant; data caches via TanStack Query.

## Commands
| Command | What |
|---|---|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | typecheck + `vite build` |
| `npm run lint` | eslint |
| `npm run seed:demo` | `tsx scripts/seed.ts` — seed demo data (adds demo users/companies — avoid on prod data) |
| `npx tsx scripts/rls-smoke-test.ts` | RLS leak-prevention suite (needs the seed users to exist) |

## Architecture notes
- `src/lib/supabase.ts` — the one browser client. `src/lib/auth.tsx` — AuthProvider,
  `useProfile()`, and the route guards (RequireInternal/RequireAdmin/RequireClient)
  mirroring the old server guards. Guards do routing UX only; **RLS enforces.**
- Actions are plain async functions next to their pages (`src/pages/*/actions.ts`),
  same `(prevState, formData)` signatures — `useActionState` components unchanged.
  `revalidatePath` became `queryClient.invalidateQueries` (keys: projects, project/id,
  clients, client/id, tasks, documents, users, staff, dashboard, profile, portal/*).
- **The one service-role operation** is user invitation:
  `supabase/functions/invite-user` (edge function; verifies caller is an active
  admin, then GoTrue invite + `app_metadata` stamp). Deploy:
  `supabase functions deploy invite-user` + secret
  `SITE_URL=https://silverline-management.co.za`.
- **Production domain:** `https://silverline-management.co.za` (www redirects to
  the apex; the `*.vercel.app` URL still resolves). Auth emails follow Supabase's
  **Authentication → URL Configuration**, not the app — keep Site URL and the
  Redirect URLs list pointed at this domain.
- Vercel: `vercel.json` pins framework=vite + SPA rewrite. Env vars
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` only — the service key must
  never be a Vercel env var again.

## Second Brain sync
Juandre keeps a Second Brain vault (Obsidian + git) at
`C:\Users\juand\dev\second-brain` (moved out of OneDrive 2026-07-05) — this app's project
file lives at `Projects\Silverline Management Portal.md` there. At the end of a work
session, or after finishing a meaningful chunk: append what was done / what's left to
`MOC\In Progress.md` in that vault, then `git commit` + `git push` **that repo too**
(it's a separate git repo on the same machine — different folder, own remote). Keep it
to a couple of lines; fuller lasting feature/architecture detail belongs in the vault
project file itself, not just a status update.
