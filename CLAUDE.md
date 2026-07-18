# Silverline Management App — Claude guide

Project-tracking portal for [[Silverline]] (environmental compliance consultancy) —
cross-project progress, "what's next" per engagement, and a client login planned
so clients see only their own project's progress.

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript · Supabase (`@supabase/ssr` +
`supabase-js`) · Tailwind 4 · shadcn/radix-ui · Zod.

## Commands
| Command | What |
|---|---|
| `npm run dev` | Local dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | `next build` |
| `npm run lint` | eslint |
| `npm run seed:demo` | `tsx scripts/seed.ts` — seed demo data |

## Second Brain sync
Juandre keeps a Second Brain vault (Obsidian + git) at
`C:\Users\juand\dev\second-brain` (moved out of OneDrive 2026-07-05) — this app's project
file lives at `Projects\Silverline Management Portal.md` there. At the end of a work
session, or after finishing a meaningful chunk: append what was done / what's left to
`MOC\In Progress.md` in that vault, then `git commit` + `git push` **that repo too**
(it's a separate git repo on the same machine — different folder, own remote). Keep it
to a couple of lines; fuller lasting feature/architecture detail belongs in the vault
project file itself, not just a status update.
