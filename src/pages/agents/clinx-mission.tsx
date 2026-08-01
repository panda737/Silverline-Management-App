/**
 * ClinX — Section 31L Enforcement Mission Control.
 *
 * An enforcement matter reads differently from a licensing application: there is
 * no statutory submission clock counting down, there is a notice that has already
 * been issued, representations already made, and a standing reporting obligation
 * with no end date. The tabs follow that shape rather than the WML one.
 */
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ACTION_PLAN,
  DIRECTOR_QUESTIONS,
  DISPUTED_NCR,
  FINDINGS,
  NCRS,
  PARTIES,
  PROJECT,
  REPORTING,
  TIMELINE,
  UNFILED_DOCUMENTS,
} from "@/lib/demo/clinx";
import { FindingCard, MissionTabs, Stat, daysSince, daysUntil } from "./shared";

const TABS = [
  { value: "brief", label: "Brief" },
  { value: "request", label: "Director's request" },
  { value: "ncrs", label: "Non-conformances" },
  { value: "reporting", label: "Monthly reporting" },
  { value: "timeline", label: "Enforcement timeline" },
  { value: "documents", label: "Documents" },
  { value: "parties", label: "Who's who" },
];

const KIND_STYLES: Record<string, string> = {
  notice: "border-destructive/40 bg-destructive/5",
  submitted: "border-border bg-muted/30",
  ack: "border-emerald-500/30 bg-emerald-500/5",
  due: "border-amber-500/40 bg-amber-500/5",
  open: "border-dashed border-border bg-transparent",
};

export function ClinxMission() {
  const critical = FINDINGS.filter((f) => f.severity === "critical");
  const high = FINDINGS.filter((f) => f.severity === "high");
  const openQuestions = DIRECTOR_QUESTIONS.filter((q) => q.state === "open");
  const daysSinceRequest = daysSince("2026-06-30");
  const daysToNextReport = daysUntil(REPORTING.next);

  return (
    <Tabs defaultValue="brief" className="gap-0">
      <MissionTabs tabs={TABS} />

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="brief" className="space-y-5 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Days since the Director's request"
            value={String(daysSinceRequest)}
            tone="bad"
            note="EDMS 274535, signed 30 June"
          />
          <Stat
            label="Questions still unanswered"
            value={`${openQuestions.length} of ${DIRECTOR_QUESTIONS.length}`}
            tone="bad"
            note="Both concern the external audit"
          />
          <Stat
            label="Audit non-conformances"
            value={String(NCRS.length)}
            tone="warn"
            note="No resolution dates given"
          />
          <Stat
            label="Monthly reports submitted"
            value={String(REPORTING.submitted.length)}
            tone="good"
            note={`No gaps · ${
              daysToNextReport > 0
                ? `next due in ${daysToNextReport} days`
                : daysToNextReport === 0
                  ? "next due today"
                  : `next was due ${-daysToNextReport} days ago`
            }`}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where this file stands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              DFFE issued a Notice of Intention to serve a Compliance Notice under
              section 31L on 4 December 2025, for non-compliance with the
              conditions of the facility's waste management licence. ClinX
              responded, an Action Plan was accepted under{" "}
              <span className="font-medium text-foreground">EDMS 268095</span>,
              and monthly progress reporting has run without a gap since February —
              two days ahead of the date committed to. That part of the file is
              working.
            </p>
            <p>
              What has changed is who is asking. The information request of 30 June
              was signed by{" "}
              <span className="font-medium text-foreground">
                Grant Walters, Director: Enforcement
              </span>
              , not by the control officer who has run the matter until now. It
              asks three questions; the monthly report of 3 July answers one of
              them. The two still open both turn on the external audit rather than
              the action plan, and one of them asks Silverline directly, as the
              external auditor, for a professional opinion.
            </p>
            <p className="text-foreground">
              The blocker on answering is that the audit exists in two versions
              dated the same day with different conclusions, and the Department
              holds the one with fewer findings. That has to be settled before any
              resolution date is given, because the answer to “when will the four
              be resolved” depends on whether there are four.
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
      <TabsContent value="request" className="space-y-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Information request — EDMS 274535, 30 June 2026
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Signed by Grant Walters, Director: Enforcement — Environmental Impact
              and Pollution, Grade 1 Environmental Management Inspector. Addressed
              to Mr Ernest Botha. It refers to the notice of 4 December 2025, the
              action plan of 21 January 2026 and the external audit of 22 May 2026.
            </p>
            <p className="text-foreground">
              Paragraph 3 restates the standing obligation: “Monthly Progress
              Reports must be submitted to the Department until the date advised
              otherwise by the Department.”
            </p>
          </CardContent>
        </Card>

        {DIRECTOR_QUESTIONS.map((q) => (
          <Card
            key={q.ref}
            className={cn(
              q.state === "open" && "border-destructive/40 bg-destructive/5"
            )}
          >
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start gap-3">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {q.ref}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[11px]",
                    q.state === "answered"
                      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : "border-destructive/40 text-destructive"
                  )}
                >
                  {q.state === "answered" ? "Answered" : "Open"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed">{q.question}</p>
              <p className="text-sm text-muted-foreground">{q.position}</p>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="ncrs" className="space-y-3 pt-6">
        <p className="text-sm text-muted-foreground">
          From the 22 May external audit — the version the Department holds. The
          request asks for a date against each of these, and none has been given.
        </p>
        {NCRS.map((n) => (
          <Card key={n.ref}>
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {n.ref}
                </span>
                <span className="text-xs text-muted-foreground">
                  Condition {n.condition}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[11px]",
                    n.status === "non_compliant"
                      ? "border-destructive/40 text-destructive"
                      : "border-amber-500/40 text-amber-700 dark:text-amber-400"
                  )}
                >
                  {n.status === "non_compliant" ? "Non-compliant" : "Partially compliant"}
                </Badge>
                {n.due !== "—" && (
                  <span className="text-xs text-muted-foreground">Due {n.due}</span>
                )}
              </div>
              <p className="text-sm leading-relaxed">{n.requirement}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Observed: </span>
                {n.observation}
              </p>
              <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
                {n.note}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">
              Disputed — condition {DISPUTED_NCR.condition}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="leading-relaxed">{DISPUTED_NCR.requirement}</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Observed: </span>
              {DISPUTED_NCR.observation}
            </p>
            <p className="text-muted-foreground">
              Present in{" "}
              <span className="font-mono text-xs">{DISPUTED_NCR.inVersion}</span>{" "}
              and absent from{" "}
              <span className="font-mono text-xs">{DISPUTED_NCR.absentFrom}</span>.
              The Department holds the version without it.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="reporting" className="space-y-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">The obligation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{REPORTING.commitment}</p>
            <p>
              Committed from{" "}
              <span className="font-medium text-foreground">
                {REPORTING.committedFrom}
              </span>
              . Next report due{" "}
              <span className="font-medium text-foreground">{REPORTING.next}</span>
              .
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {REPORTING.submitted.map((r) => (
            <div
              key={r.sent}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3"
            >
              <span className="font-mono text-xs tabular-nums">{r.sent}</span>
              <span className="text-sm font-medium">{r.covers}</span>
              {r.ack && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  {r.ack}
                </span>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-amber-500/40 px-4 py-3">
            <span className="font-mono text-xs tabular-nums">{REPORTING.next}</span>
            <span className="text-sm font-medium">July 2026 — due</span>
            <span className="text-xs text-muted-foreground">
              in {daysToNextReport} days
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Action plan measures — {ACTION_PLAN.period}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Submitted by {ACTION_PLAN.submittedBy}. All eleven signed off by the
              General Manager on {ACTION_PLAN.signedOff} and recorded as ongoing
              and maintained. These track the notice's Table 1 findings — they are
              a different list from the audit non-conformances above, which is why
              answering 2.2 did not answer 2.3.
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {ACTION_PLAN.measures.map((m) => (
                <li key={m} className="flex gap-2 text-sm">
                  <span className="mt-[0.55em] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {m}
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
      <TabsContent value="documents" className="space-y-3 pt-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">
              None of this is filed in the portal.
            </p>
            <p className="mt-1 text-muted-foreground">
              The ClinX project record holds zero documents, zero deadlines and
              zero tasks. Everything below sits on a local machine, which is why an
              enforcement matter running since December 2025 is invisible to anyone
              who opens the project.
            </p>
          </CardContent>
        </Card>
        {UNFILED_DOCUMENTS.map((d) => (
          <div
            key={d.name}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border px-4 py-3"
          >
            <span className="font-mono text-xs">{d.name}</span>
            <span className="text-sm text-muted-foreground">{d.note}</span>
          </div>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="parties" className="space-y-2 pt-6">
        <p className="text-sm text-muted-foreground">
          Four organisations touch this file — DFFE, ClinX, Inyathi and Silverline,
          with Green Law and Enviroreg alongside. The authorship question matters:
          the action plan before the Department is submitted in Inyathi's name.
        </p>
        {PARTIES.map((p) => (
          <div key={p.email} className="rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{p.name}</span>
              <Badge variant="outline" className="rounded-full text-[11px]">
                {p.org}
              </Badge>
              <span className="font-mono text-[11px] text-muted-foreground">
                {p.email}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.role}</p>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

export const CLINX_HEADER = {
  title: "Section 31L Mission Control",
  description: `${PROJECT.facility} · licence ${PROJECT.licence}. Every figure is read from the notice, the correspondence and the audit.`,
  badge: PROJECT.routeLabel,
};
