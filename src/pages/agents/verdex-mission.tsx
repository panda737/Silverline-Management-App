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
            note="One decides if there is a matter"
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where this file stands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Verdex manufactures composite plastic boards from sorted, baled
              plastic at Waltloo. Feedstock receipt began in August 2025,
              shredding in January 2026 and pressing in March 2026 — all of it
              before any environmental authorisation, which is what puts a
              Section 24G rectification on the table alongside the waste licence.
              The mandate went live on 27 July when the signed quotation and proof
              of the R80,000 Phase 1 payment came in, and the client asked to move
              urgently.
            </p>
            <p className="text-foreground">
              One question governs everything else: whether the sorted and baled
              plastic Verdex buys is still <em>waste</em> under NEM:WA. If it is a
              commodity, there is no listed activity, no licence and no Section
              24G. If it is waste, the capacity figures put the facility inside
              the licensing band and the rectification is real.
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
        {LEGAL_QUESTIONS.map((q, i) => (
          <Card
            key={i}
            className={cn(
              q.state === "blocking" && "border-destructive/40 bg-destructive/5"
            )}
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{q.question}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-full text-[11px]",
                    q.state === "blocking"
                      ? "border-destructive/40 text-destructive"
                      : "border-amber-500/40 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {q.state === "blocking" ? "Blocking" : "Open"}
                </Badge>
              </div>
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
