# Handover — continue on the main PC

Branch: **`feat/wml-demo-agents`** (pushed). Started on the work laptop, which
has no Node.js and no `.env.local`, so nothing has been run or typechecked yet.

## Pick up here

```bash
git fetch origin
git checkout feat/wml-demo-agents
npm install
npm run typecheck     # FIRST — none of the new code has ever been compiled
npm run dev           # then open http://localhost:3000/demo
```

## What was built

**1. A `Demo` tab in the top nav** → `/demo` — "WML Mission Control", a command
centre for a live waste management licence application. It runs on the real
Dilex Inland Elandsfontein file: every figure, date, reference and condition was
read out of the actual 75-document submission pack in
`OneDrive\Projects\Silverline\Elandsfontein EIA Dialex\Dilex Inland WML`.

Seven tabs: Brief (ranked findings), Statutory clock, the seven acceptance
conditions, Participation, Specialist studies, Scope, Agent fleet.

Static fixture in `src/lib/demo/dilex.ts` — no Supabase, no client data, safe to
open in front of anyone. When the tool graduates out of Demo it reads the same
shapes from the database.

**2. The agent fleet** — a supervisor plus six specialists.
Full map in `supabase/functions/AGENTS.md`.

| Piece | Where |
|---|---|
| Supervisor | `supabase/functions/agent-supervisor/index.ts` |
| Specialists | `supabase/functions/agent-worker/index.ts` |
| The six prompts | `supabase/functions/agent-worker/prompts.ts` |
| Tables | `supabase/migrations/20260725000001_agent_fleet.sql` |

Specialists: `statutory-clock`, `ppp-registrar`, `comments-responses`,
`doc-completeness`, `specialist-studies`, `obligation-register`.

They follow the existing `licence-review` pattern exactly — Anthropic SDK,
structured output, state written to a row the UI polls. Agents propose, never
act outward; findings dedupe by fingerprint so a daily run ages one row rather
than piling up, and a human dismissal sticks.

## Not done yet

- **Nothing has been typechecked or run.** Expect small fixes on first compile.
- Migration not applied; edge functions not deployed.
- `ANTHROPIC_API_KEY` secret not set for the new functions.
- The fleet has no UI beyond the Demo tab's Fleet panel — no run button, no
  findings inbox on a real project yet.
- No scheduler. Run it manually first, read a week of briefs, then decide
  whether it earns a `pg_cron` job.

## Deploy, when ready

```bash
supabase db push
supabase functions deploy agent-supervisor
supabase functions deploy agent-worker
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## What the document review actually found

This matters more than the code. Written up in the vault at
`Projects/Silverline/Dilex Elandsfontein WML & S&EIR.md` and
`Projects/Silverline/Dilex PPP & CRR File.md` (committed and pushed).

The headlines:

- **Rezoning is a precondition to use.** Acceptance condition 3: *"the site
  cannot be used for waste management activities prior to the rezoning of the
  site."* Zoned Agriculture. Runs through Ekurhuleni on its own SPLUMA timeline.
  Not on the project programme. A licence over an unrezoned site cannot be
  exercised.
- **The FSR was submitted before the comment window closed** — 3 June, against
  windows closing 5 and 7 June. An objector has already pleaded defective
  public participation and asked for a 30-day recommencement.
- **No organ of state was notified** — yet the cover letter told DFFE that
  organ-of-state comments had been received and responded to.
- **An active DFFE enforcement matter on this site** (letter of 30 March 2026,
  EMI joint inspection with Ekurhuleni) is not in the project file.
- **The whole technical procedure pack describes the Durban site** — eThekwini
  permits, 031 emergency numbers, an emergency plan written against the Durban
  licence's condition numbers.
- **Pyrolysis was removed from the FSR but is still in the filed procedures**,
  with scrubbed gas expelled to atmosphere and no AEL pathway referenced.
- **Six Screening-Tool specialist studies are neither scoped nor motivated out**,
  including any groundwater study at all — for ~600 000 L of hazardous liquid
  over a 6–8 m water table neighbours rely on solely.
- **No EIR deadline exists on the file.** The acceptance letter sets none.
  Regulation 23's 106 days from 16 July would land ~30 October 2026, but that is
  derived — confirm it in writing with Cynthia Baloyi.
