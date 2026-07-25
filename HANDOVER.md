# WML demo + agent fleet — state of the branch

Branch: **`feat/wml-demo-agents`**. Written on a work laptop with no Node.js, so
nothing had ever been compiled. It has now been compiled, fixed, deployed and
smoke-tested on the main PC.

## Done

- `npm run check` passes — typecheck, lint, and `deno check` over the edge
  functions.
- `/demo` renders; all seven tabs verified in the browser, no console or server
  errors.
- Migration `20260725000001_agent_fleet.sql` applied to `vdycgxxdirscvnrqiizg`.
  Four tables live, RLS confirmed readable by an internal user, all seven roster
  rows seeded.
- `agent-supervisor` and `agent-worker` deployed. Both boot and return their own
  auth-guard responses (401 / 403), so the modules load and the guards work.
- `ANTHROPIC_API_KEY` needed no action — Supabase secrets are **project-wide**,
  not per-function, so the new functions inherit the key `licence-review`
  already uses.

## What was actually broken

Four bugs, none of which `tsc` could have caught on its own:

1. `src/pages/demo/index.tsx` filtered acceptance conditions on `!== "done"`
   against a `"open" | "blocker"` union — a filter that could never exclude
   anything, so the "N of 7" stat could never go down. `done` added to the type.
2. `agent-worker` selected `documents.mime_type`, **which does not exist**.
   PostgREST 400s the whole query; the error was discarded, so `docs` came back
   null and the loop never ran.
3. `agent-worker` downloaded from bucket `documents`; the bucket is
   `project-documents`.
4. `agent-supervisor`'s wait loop treated a failed poll as "all workers
   finished" — `[].every()` is `true` — and collated while workers were still
   writing.

2 and 3 compounded: `doc-completeness`, `comments-responses` and
`obligation-register` would have been told "no PDF documents are filed against
this project yet, treat everything as unverifiable" on a fully populated file,
and the task would still have completed green. The swallowed error that hid
both now throws.

A fifth, pre-existing, in `licence-review`: `ReturnType<typeof createClient>`
resolves table types to `never`. Switched to the imported `SupabaseClient` type,
matching the new functions. Type-only — the deployed behaviour is unchanged.

## Why `npm run check` exists

`supabase/functions` is **outside the tsconfig `include`** and is Deno, not
Node, so `npm run typecheck` never saw any of it — 1,100 lines checked by
nothing. `check:functions` closes that hole via `npx deno@2` (no system
install).

Keep `--node-modules-dir=none`. Without it Deno walks up to the root
`package.json` and takes over the app's `node_modules`, which breaks the Vite
build until you reinstall. It is deliberately not part of `npm run build`, so
Vercel never downloads a Deno binary to ship the SPA.

## Genuinely still to do

- **The fleet has never been run end to end.** Everything above proves it
  compiles, deploys and guards correctly — not that a cycle produces a sensible
  brief. First real run should be against one project, watched.
- No UI beyond the Demo tab's Fleet panel — no run button, no findings inbox on
  a real project.
- No scheduler. Run it manually, read a week of briefs, then decide whether it
  earns a `pg_cron` job.
- `agent_runs.triggered_by` is never populated by the supervisor.

## What the document review found

This still matters more than the code. Written up in the vault at
`Projects/Silverline/Dilex Elandsfontein WML & S&EIR.md` and
`Projects/Silverline/Dilex PPP & CRR File.md`.

- **Rezoning is a precondition to use.** Acceptance condition 3: the site
  cannot be used for waste management activities prior to rezoning. Zoned
  Agriculture. Runs through Ekurhuleni on its own SPLUMA timeline. Not on the
  project programme.
- **The FSR was submitted before the comment window closed** — 3 June, against
  windows closing 5 and 7 June. An objector has already pleaded defective public
  participation and asked for a 30-day recommencement.
- **No organ of state was notified** — yet the cover letter told DFFE that
  organ-of-state comments had been received and responded to.
- **An active DFFE enforcement matter on this site** (letter of 30 March 2026)
  is not in the project file.
- **The whole technical procedure pack describes the Durban site** — eThekwini
  permits, 031 emergency numbers, an emergency plan written against the Durban
  licence's condition numbers.
- **Pyrolysis was removed from the FSR but is still in the filed procedures**,
  with scrubbed gas expelled to atmosphere and no AEL pathway referenced.
- **Six Screening-Tool specialist studies are neither scoped nor motivated out**,
  including any groundwater study at all.
- **No EIR deadline exists on the file.** Regulation 23's 106 days from 16 July
  would land ~30 October 2026, but that is derived — confirm in writing with
  Cynthia Baloyi.
