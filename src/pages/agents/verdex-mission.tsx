/**
 * Verdex — Section 24G Rectification + WML Mission Control.
 *
 * A rectification reads differently again. There is no notice to answer and no
 * submission deadline to count down to — the activity started first and the
 * authorisation is being sought afterwards. So the tabs lead with the legal
 * questions that decide whether there is a matter at all, then the commencement
 * record the application turns on, then what is still owed.
 */
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CAPACITY,
  EAP_TASKS,
  EVIDENCE_HELD,
  FEEDSTOCK,
  FINDINGS,
  LEGAL_QUESTIONS,
  LISTED_ACTIVITIES,
  THE_POSITION,
  OUTSTANDING,
  PROJECT,
  TIMELINE,
} from "@/lib/demo/verdex";
import { FindingCard, MissionTabs, Stat, daysUntil } from "./shared";

const TABS = [
  { value: "brief", label: "Brief" },
  { value: "legal", label: "Legal questions" },
  { value: "commencement", label: "Commencement" },
  { value: "operation", label: "Operation" },
  { value: "outstanding", label: "Outstanding" },
  { value: "timeline", label: "Engagement timeline" },
  { value: "evidence", label: "Evidence held" },
];

const KIND_STYLES: Record<string, string> = {
  commenced: "border-destructive/40 bg-destructive/5",
  submitted: "border-border bg-muted/30",
  received: "border-emerald-500/30 bg-emerald-500/5",
  open: "border-dashed border-border bg-transparent",
  due: "border-amber-500/40 bg-amber-500/5",
};

export function VerdexMission() {
  const critical = FINDINGS.filter((f) => f.severity === "critical");
  const high = FINDINGS.filter((f) => f.severity === "high");
  const blocking = LEGAL_QUESTIONS.filter((q) => q.state === "blocking");
  const chase = TIMELINE.find((t) => t.kind === "due");
  const daysToChase = chase ? daysUntil(chase.date) : null;

  return (
    <Tabs defaultValue="brief" className="gap-0">
      <MissionTabs tabs={TABS} />

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="brief" className="space-y-5 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Blocking legal questions"
            value={`${blocking.length} of ${LEGAL_QUESTIONS.length}`}
            tone="bad"
            note="Lodging stops the plant — client's call"
          />
          <Stat
            label="Design capacity"
            value="30 t/day"
            tone="warn"
            note="Threshold is 10 t/day"
          />
          <Stat
            label="Client items outstanding"
            value={String(OUTSTANDING.length)}
            tone="warn"
            note="Checklist sent 27 July"
          />
          <Stat
            label="Mandate"
            value="Live"
            tone="good"
            note={
              daysToChase === null
                ? "Phase 1 paid"
                : daysToChase > 0
                  ? `Phase 1 paid · chase in ${daysToChase} days`
                  : "Phase 1 paid · chase now"
            }
          />
        </div>

        {/*
          The position leads the brief. It is what every motivation, the fine
          representations and every authority meeting are built on, and burying
          it below the status narrative is how it ends up being written as a
          closing paragraph instead of as the case.
        */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">The position we run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{THE_POSITION.line}</p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {THE_POSITION.pillars.map((p) => (
                <div
                  key={p.title}
                  className="rounded-md border bg-background/60 p-3"
                >
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.detail}
                  </p>
                </div>
              ))}
            </div>

            {/*
              The limit, next to the argument rather than in a footnote. The
              same case that carries the fine representations is a credibility
              problem if it is used to say the material is not waste.
            */}
            <div className="space-y-2">
              {THE_POSITION.whereItHelps.map((w) => (
                <div key={w.weight} className="flex flex-wrap gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 rounded-full text-[11px]",
                      w.weight === "Strongest" &&
                        "border-emerald-600/40 text-emerald-700 dark:text-emerald-400",
                      w.weight === "Not a safe use" &&
                        "border-destructive/40 text-destructive"
                    )}
                  >
                    {w.weight}
                  </Badge>
                  <span className="flex-1 text-muted-foreground">{w.use}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {THE_POSITION.evidenceNeeded}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where this file stands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Verdex manufactures composite plastic boards from sorted, baled
              plastic at Waltloo. Feedstock receipt began in August 2025,
              construction of the facility from around September 2025, shredding
              on production material on 10 March 2026 and the first board on
              13 March 2026 — all of it before any environmental authorisation,
              which is what puts a Section 24G rectification on the table
              alongside the waste licence. The mandate went live on 27 July when
              the signed quotation and the Phase 1 payment came in.
            </p>
            <p className="text-foreground">
              The classification question that governed this file is settled. The
              material is treated as <strong>general waste</strong>; there is no
              relabelling or payment-based &ldquo;feedstock&rdquo; route, and the
              capacity figures put the facility inside the licensing band. What
              is left is not whether the rectification is real, but on what
              footing it is put — and whether the client will lodge at all, given
              that lodging stops the plant.
            </p>
            <p>
              That second point is where the arithmetic misleads. Throughput of
              10–15 tonnes a week averages just over a tonne a day and reads as
              small. But the threshold test is capacity, not throughput, and
              Verdex reports a design capacity near 30 tonnes a day with a press
              maximum near 48 — both above the 10 t/day line.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">
            Findings — {critical.length} critical · {high.length} high
          </h2>
          {FINDINGS.map((f, i) => (
            <FindingCard key={i} finding={f} />
          ))}
        </div>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="legal" className="space-y-3 pt-6">
        <p className="text-sm text-muted-foreground">
          Recorded as unresolved in the working file. No submission should assign
          answers to these without a documented legal assessment and authority
          engagement.
        </p>
        {/*
          The activities themselves, quoted from the gazette. Everything else on
          this tab argues about these words, so they belong on the page rather
          than in someone's memory of them.
        */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-sm font-medium">The listed activities</p>
              <p className="text-xs text-muted-foreground">
                GN 921 in GG 37083 of 29 November 2013, as amended to GN 1757 of
                11 February 2022 · GN 893 under NEM:AQA s21
              </p>
            </div>
            {LISTED_ACTIVITIES.map((a) => (
              <div
                key={a.citation}
                className={cn(
                  "rounded-md border p-3",
                  a.bearing === "applies" && "border-destructive/40 bg-destructive/5",
                  a.bearing === "excluded-question" && "border-amber-500/40 bg-amber-500/5",
                  a.bearing === "not-a-licence" && "border-border bg-muted/40",
                  a.bearing === "does-not-apply" && "border-border opacity-70"
                )}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-medium">
                    {a.citation}
                  </span>
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {a.bearing === "applies"
                      ? "Applies"
                      : a.bearing === "excluded-question"
                        ? "Applies unless the exclusion holds"
                        : a.bearing === "not-a-licence"
                          ? "Listed, but no licence"
                          : "Threshold not met"}
                  </Badge>
                </div>
                <p className="mb-1 text-sm italic text-muted-foreground">
                  “{a.wording}”
                </p>
                <p className="text-sm">{a.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {LEGAL_QUESTIONS.map((q, i) => (
          <Card
            key={i}
            className={cn(
              q.state === "blocking" && "border-destructive/40 bg-destructive/5",
              q.state === "decided" && "border-emerald-600/40 bg-emerald-500/5"
            )}
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{q.question}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-full text-[11px]",
                    q.state === "blocking" &&
                      "border-destructive/40 text-destructive",
                    q.state === "open" &&
                      "border-amber-500/40 text-amber-700 dark:text-amber-400",
                    q.state === "decided" &&
                      "border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                  )}
                >
                  {q.state === "blocking"
                    ? "Blocking"
                    : q.state === "decided"
                      ? "Answered"
                      : "Open"}
                </Badge>
              </div>
              {/*
                The answer leads once there is one. A reader scanning this tab
                wants to know what was decided, not to re-read why it mattered.
              */}
              {q.answer && (
                <p className="rounded-md border border-emerald-600/30 bg-background/60 p-2 text-sm">
                  {q.answer}
                </p>
              )}
              <p className="text-sm text-muted-foreground">{q.why}</p>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="commencement" className="space-y-3 pt-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">
              A Section 24G turns on exactly when the activity commenced.
            </p>
            <p className="mt-1 text-muted-foreground">
              Every date below is a month, not a date. These frame the
              rectification, they are what the authority tests the representations
              against, and they bear on the fine. They are also the only
              outstanding items that cannot be reconstructed later from records
              Silverline holds.
            </p>
          </CardContent>
        </Card>
        {TIMELINE.filter((e) => e.kind === "commenced").map((e, i) => (
          <div key={i} className="rounded-lg border border-destructive/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tabular-nums">{e.date}</span>
              <span className="text-sm font-medium">{e.label}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
          </div>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="operation" className="space-y-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CAPACITY.map((c) => (
              <div
                key={c.label}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0"
              >
                <span className="min-w-[11rem] text-sm">{c.label}</span>
                <span className="text-sm font-medium tabular-nums">{c.value}</span>
                {c.note && (
                  <span className="text-xs text-muted-foreground">{c.note}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground">{PROJECT.process}</p>
            <p>
              Compression moulding takes place in an open heated press at roughly
              200–220 °C. The process is designed to melt and consolidate plastic,
              not to decompose or combust it, and produces no intentional oil,
              condensate, ash or char. Local extraction is installed above the
              presses; its specification has not been supplied.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feedstock ledger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <p>
                <span className="text-foreground">Period: </span>
                {FEEDSTOCK.period}
              </p>
              <p>
                <span className="text-foreground">Entries: </span>
                {FEEDSTOCK.entries}
              </p>
              <p>
                <span className="text-foreground">Gross: </span>
                {FEEDSTOCK.gross}
              </p>
              <p>
                <span className="text-foreground">Rejected: </span>
                {FEEDSTOCK.rejected}
              </p>
              <p>
                <span className="text-foreground">Net accepted: </span>
                {FEEDSTOCK.net}
              </p>
              <p>
                <span className="text-foreground">Types: </span>
                {FEEDSTOCK.types}
              </p>
            </div>
            <p>{FEEDSTOCK.excluded}</p>
            <p className="text-foreground">{FEEDSTOCK.gaps}</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="outstanding" className="space-y-4 pt-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">Sent to Dewald and Ruhan on 27 July at 16:24.</p>
            <p className="mt-1 text-muted-foreground">
              Thirteen minutes after an internal draft circulated under the subject
              “DRAFT VERDEX DETAILS”, which went only to Luaan and Admin. The
              client-facing request is out; no reply date was set with the client.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-1.5">
          {OUTSTANDING.map((o, i) => (
            <div
              key={i}
              className="flex flex-wrap items-baseline gap-x-3 rounded-lg border px-4 py-2.5"
            >
              <Badge variant="outline" className="rounded-full text-[11px]">
                {o.section}
              </Badge>
              <span className="text-sm text-muted-foreground">{o.item}</span>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not client gaps — Silverline's own work</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {EAP_TASKS.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="timeline" className="space-y-2 pt-6">
        {TIMELINE.map((e, i) => (
          <div
            key={i}
            className={cn("rounded-lg border px-4 py-3", KIND_STYLES[e.kind])}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tabular-nums">{e.date}</span>
              <span className="text-sm font-medium">{e.label}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
          </div>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="evidence" className="space-y-2 pt-6">
        <p className="text-sm text-muted-foreground">
          Held in the S24G package. Administrative documents are complete — these
          must not be requested again as Section 24G gaps.
        </p>
        {EVIDENCE_HELD.map((d) => (
          <div
            key={d.name}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border px-4 py-3"
          >
            <span className="font-mono text-xs">{d.name}</span>
            <span className="text-sm text-muted-foreground">{d.note}</span>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

export const VERDEX_HEADER = {
  title: "Section 24G Mission Control",
  description: `${PROJECT.facility} · ${PROJECT.address}. Built from the S24G package and verified against the mailbox.`,
  badge: PROJECT.routeLabel,
};
