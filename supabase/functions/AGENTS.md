# The agent fleet — what runs where

A supervisor and six specialists that work a regulatory licensing file
continuously, so the state of the project stops depending on somebody
remembering it.

## Where each piece lives

| Piece | Location | What it is |
|---|---|---|
| **Supervisor** | `supabase/functions/agent-supervisor/index.ts` | Reads project state, plans the cycle, dispatches specialists, collates findings, writes the brief |
| **Specialists** | `supabase/functions/agent-worker/index.ts` | One function, six behaviours — claims a task, asks its question, writes findings |
| **The six prompts** | `supabase/functions/agent-worker/prompts.ts` | Where the specialists actually differ. Edit here to change behaviour |
| **Roster** | `agent_definitions` table | Which agents exist, which routes and stages they apply to, dispatch order, on/off |
| **State** | `agent_runs`, `agent_tasks`, `agent_findings` tables | Migration `20260725000001_agent_fleet.sql` |
| **UI** | `src/pages/demo/index.tsx` → Fleet tab | Currently the demo view; graduates to a per-project tab |

Nothing runs on a laptop. The agents are Supabase edge functions next to
`licence-review`, which they deliberately mirror: model call, structured output,
state written to a row, UI polls the row.

## The cycle

```
schedule / button
      │
      ▼
agent-supervisor ── loads state ──► plans ──► writes agent_tasks
      │                                            │
      │                              ┌─────────────┼─────────────┐
      │                              ▼             ▼             ▼
      │                        agent-worker  agent-worker  agent-worker
      │                        statutory-    ppp-          doc-
      │                        clock         registrar     completeness
      │                              │             │             │
      │                              └─────────────┼─────────────┘
      │                                            ▼
      │                                     agent_findings
      ▼                                            │
   waits ◄──────────────────────────────────────────┘
      │
      ▼
  collates ──► dedupes ──► ranks ──► agent_runs.brief
```

## The six specialists

| Key | Question it answers |
|---|---|
| `statutory-clock` | Is every deadline anchored to a date the authority actually stated, and is anything about to run out? |
| `ppp-registrar` | Would this public participation record survive a challenge? |
| `comments-responses` | What still needs answering, and what would a defensible answer say? |
| `doc-completeness` | Is the pack complete, and does it say the same thing everywhere? |
| `specialist-studies` | Will the specialist work actually be there when the report is due? |
| `obligation-register` | Is every licence obligation captured, dated, owned and being met? |

Each owns exactly one question. That is the design: a specialist asked one
question gives a checkable answer, a specialist asked to "review the project"
gives a plausible essay.

## Rules the fleet runs under

**Agents propose, they never act outward.** Nothing is emailed, submitted or
filed on an agent's reasoning. On a regulatory file a wrong outward action is
not recoverable, so every finding is a proposal a human accepts, edits or
dismisses.

**Evidence or it does not exist.** Every finding carries the document, clause,
page or register row behind it. A finding that cannot be pointed at is dropped
before it reaches the list.

**A dismissal sticks.** Findings dedupe by fingerprint — project + agent +
subject. The same issue found twice updates one row and moves `last_seen_at`.
Anything a human dismissed is fed back into the next cycle's context and is not
raised again unless the underlying facts changed. Without this, a daily fleet
becomes noise within a week and gets ignored.

**The supervisor's skips are recorded.** `agent_runs.plan` holds what it chose
not to run and why, so the judgement is reviewable, not just the output.

## Deploying

```bash
supabase functions deploy agent-supervisor
supabase functions deploy agent-worker
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

The migration seeds the roster. `ANTHROPIC_MODEL` is optional and defaults to
`claude-opus-5`.

## Scheduling

Workers are dispatched by the supervisor only — `agent-worker` rejects anything
not bearing the service key. The supervisor accepts either a signed-in staff
member (the button in the UI) or the service key (the scheduler).

To run the fleet daily, add a `pg_cron` job calling `agent-supervisor` with the
service key for each active project. Start it manual-only, read a week of
briefs, and turn the schedule on once the findings are worth waking up to.

## Adding a specialist

1. Add its prompt to `WORKER_PROMPTS` in `prompts.ts`.
2. `insert into agent_definitions` with its key, role, `edge_function =
   'agent-worker'`, and the routes/stages it applies to.
3. Redeploy `agent-worker`.

No migration, no schema change. If a future specialist needs its own runtime —
a different tool set, a longer timeout, its own model — point its
`edge_function` at a new function instead.
