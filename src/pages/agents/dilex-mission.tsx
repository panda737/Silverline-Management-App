/**
 * Dilex Inland — WML Mission Control.
 *
 * The command centre for a live waste management licence application, built on
 * the real Dilex Inland Elandsfontein file. Everything shown is read out of the
 * actual submission pack (see src/lib/demo/dilex.ts).
 *
 * Static fixture, no Supabase, no client data — safe to open in front of anyone.
 */
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ACCEPTANCE_CONDITIONS,
  AGENTS,
  CAPACITY,
  COMMENT_THEMES,
  ESCALATIONS,
  FINDINGS,
  IAP_CATEGORIES,
  LISTED_ACTIVITIES,
  PPP,
  PPP_EVIDENCE,
  PROJECT,
  SENSITIVITIES,
  SPECIALIST_STUDIES,
  TIMELINE,
} from "@/lib/demo/dilex";
import { FindingCard, MissionTabs, Stat, daysUntil } from "./shared";

const TABS = [
  { value: "brief", label: "Brief" },
  { value: "clock", label: "Statutory clock" },
  { value: "conditions", label: "Conditions" },
  { value: "ppp", label: "Participation" },
  { value: "studies", label: "Specialist studies" },
  { value: "scope", label: "Scope" },
  { value: "fleet", label: "Agent fleet" },
];

export function DilexMission() {

  const eirDue = TIMELINE.find((t) => t.kind === "due");
  const daysToEir = eirDue ? daysUntil(eirDue.date) : null;
  const critical = FINDINGS.filter((f) => f.severity === "critical");
  const high = FINDINGS.filter((f) => f.severity === "high");
  const studyGaps = SPECIALIST_STUDIES.filter((s) => s.state === "gap");
  const openConditions = ACCEPTANCE_CONDITIONS.filter(
    (c) => c.status !== "done"
  );

  return (

      <Tabs defaultValue="brief" className="gap-0">
        <MissionTabs tabs={TABS} />

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="brief" className="space-y-5 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Days to the EIR submission"
              value={daysToEir === null ? "—" : String(daysToEir)}
              tone={
                daysToEir !== null && daysToEir < 30
                  ? "bad"
                  : daysToEir !== null && daysToEir < 120
                    ? "warn"
                    : undefined
              }
              note="Derived from Reg. 23, not stated by DFFE"
            />
            <Stat
              label="Critical findings"
              value={String(critical.length)}
              tone="bad"
              note={`${high.length} high`}
            />
            <Stat
              label="Acceptance conditions open"
              value={`${openConditions.length} of 7`}
              tone="warn"
              note="One is a blocker"
            />
            <Stat
              label="Specialist studies unresolved"
              value={String(studyGaps.length)}
              tone="warn"
              note="Neither scoped nor motivated out"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Where this file stands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                DFFE accepted the Final Scoping Report on 16 July 2026 subject to
                seven conditions, so the EIA phase is authorised and running.
                Condition 3 is the one that governs everything else: the site is
                zoned <span className="font-medium text-foreground">Agriculture</span>{" "}
                and cannot be used for waste management activities until it is
                rezoned. That rezoning runs through the City of Ekurhuleni on its
                own timeline and is not currently on the project programme.
              </p>
              <p>
                The larger exposure is procedural rather than technical. The
                Final Scoping Report was submitted on 3 June 2026, before the
                thirty-day comment period had closed; three organs of state were
                cc'd on the notice but none was served directly and the register
                records none of them; and the cover letter told the Department
                that organ-of-state comments had been received and responded to,
                when none were received at all. An adjacent landowner has
                already reserved the right to appeal and to take legal action.
              </p>
              <p className="text-foreground">
                The strongest move available is to treat the EIR participation
                round as the opportunity to cure the scoping round — serve every
                authority directly, acknowledge everyone, close the window
                before submitting, and put the proof of service on the record.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">
              Findings — {FINDINGS.length} open
            </h2>
            <div className="space-y-3">
              {FINDINGS.map((f, i) => (
                <FindingCard key={i} finding={f} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="clock" className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Every event anchored to the correspondence that establishes it.
            Anything derived rather than stated by the authority is marked as
            such — an unanchored statutory deadline looks fine on a dashboard
            right up until it is missed.
          </p>
          <div className="space-y-0">
            {TIMELINE.map((e, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full",
                      e.kind === "done" && "bg-emerald-500",
                      e.kind === "due" && "bg-destructive",
                      e.kind === "now" && "bg-primary"
                    )}
                  />
                  {i < TIMELINE.length - 1 && (
                    <span className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-6">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {e.date}
                    </span>
                    <span className="font-medium">{e.label}</span>
                    {e.kind === "due" && daysToEir !== null && (
                      <Badge variant="destructive" className="rounded-full">
                        {daysToEir >= 0
                          ? `${daysToEir} days`
                          : `${-daysToEir} days over`}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {e.detail}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {e.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="conditions" className="space-y-3 pt-6">
          <p className="text-sm text-muted-foreground">
            The seven conditions attached to the acceptance of the Final Scoping
            Report, quoted from the Department's letter of 16 July 2026.
          </p>
          {ACCEPTANCE_CONDITIONS.map((c) => (
            <Card key={c.n}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                    {c.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{c.title}</p>
                      {c.status === "blocker" && (
                        <Badge variant="destructive" className="rounded-full">
                          Blocker
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 border-l-2 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                      “{c.quote}”
                    </p>
                    {c.note && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {c.note}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="ppp" className="space-y-5 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Registered I&APs" value={String(PPP.registered)} />
            <Stat
              label="Comments received"
              value={String(PPP.commented)}
              note="All responded to"
            />
            <Stat
              label="Registrations acknowledged"
              value={String(PPP.acknowledged)}
              tone="bad"
              note={`${PPP.neverResponded} open next actions`}
            />
            <Stat
              label="Organs of state notified"
              value={String(PPP.organsOfState)}
              tone="bad"
              note="Cover letter says otherwise"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">The window</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Site notice and stakeholder letters dated{" "}
                <span className="font-medium text-foreground">
                  {PPP.siteNoticeDate}
                </span>
                , newspaper on{" "}
                <span className="font-medium text-foreground">
                  {PPP.newspaperDate}
                </span>{" "}
                ({PPP.newspaper}). Thirty-day windows therefore close{" "}
                {PPP.windowCloses}.
              </p>
              <p className="text-destructive">
                The Final Scoping Report was submitted on {PPP.fsrSubmitted} —
                before either window closed.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Register composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {IAP_CATEGORIES.map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span
                        className={cn(
                          c.count === 0 && "text-destructive"
                        )}
                      >
                        {c.category}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {c.count}
                      </span>
                    </div>
                    <Progress
                      value={(c.count / PPP.registered) * 100}
                      className="h-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  What people actually raised
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {COMMENT_THEMES.map((t) => (
                  <div key={t.theme} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{t.theme}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {t.count}
                      </span>
                    </div>
                    <Progress
                      value={(t.count / PPP.commented) * 100}
                      className="h-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Escalation risk</h2>
            {ESCALATIONS.map((e) => (
              <Card key={e.who}>
                <CardContent className="space-y-2 p-4 text-sm">
                  <div>
                    <p className="font-medium">{e.who}</p>
                    <p className="text-xs text-muted-foreground">{e.standing}</p>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    {e.what}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Response:
                    </span>{" "}
                    {e.response}
                  </p>
                  <p className="text-destructive">{e.risk}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Evidence pack — the definition of done
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {PPP_EVIDENCE.map((e) => (
                <div
                  key={e.item}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span
                    className={cn(
                      e.status === "missing" && "text-destructive"
                    )}
                  >
                    {e.item}
                    {e.note && (
                      <span className="text-muted-foreground"> — {e.note}</span>
                    )}
                  </span>
                  <Badge
                    variant={
                      e.status === "present"
                        ? "secondary"
                        : e.status === "partial"
                          ? "outline"
                          : "destructive"
                    }
                    className="shrink-0 rounded-full capitalize"
                  >
                    {e.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="studies" className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            The DFFE Screening Tool identified fifteen specialist assessments.
            The Plan of Study carries some as full assessments, some as
            compliance statements — and omits six without the motivation the
            Screening Report expressly requires.
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Study register</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {SPECIALIST_STUDIES.map((s) => (
                  <div key={s.name} className="flex items-start gap-3 text-sm">
                    <Badge
                      variant={
                        s.state === "gap"
                          ? "destructive"
                          : s.state === "available"
                            ? "secondary"
                            : "outline"
                      }
                      className="mt-0.5 w-24 shrink-0 justify-center rounded-full capitalize"
                    >
                      {s.state}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.note}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-sm">
                  Screening sensitivities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {SENSITIVITIES.map((s) => (
                  <div
                    key={s.theme}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>{s.theme}</span>
                    <Badge
                      variant={
                        s.level === "Very High" || s.level === "High"
                          ? "destructive"
                          : "outline"
                      }
                      className="shrink-0 rounded-full"
                    >
                      {s.level}
                    </Badge>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted-foreground">
                  The Screening Report records “No development footprint(s)
                  specified”, so these are property-wide rather than
                  footprint-specific.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="scope" className="space-y-4 pt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">The file</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {[
                  ["Applicant", PROJECT.applicant],
                  ["Contact", PROJECT.applicantContact],
                  ["EAP", PROJECT.eap],
                  ["Authority", PROJECT.authority],
                  ["Case officer", PROJECT.caseOfficer],
                  ["DFFE reference", PROJECT.dffeRef],
                  ["Storage registration", PROJECT.storageRegistrationRef],
                  ["Property", PROJECT.property],
                  ["SG code", PROJECT.sgCode],
                  ["Municipality", PROJECT.municipality],
                  ["Zoning", PROJECT.zoning],
                  ["Extent", PROJECT.extent],
                  ["Fee", PROJECT.fee],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap gap-x-2">
                    <span className="w-40 shrink-0 text-muted-foreground">
                      {k}
                    </span>
                    <span className="min-w-0 flex-1">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Capacity envelope</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                {CAPACITY.map((c) => (
                  <div key={c.label}>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{c.label}</span>
                      <span
                        className={cn(
                          "text-right font-medium",
                          c.flag && "text-destructive"
                        )}
                      >
                        {c.value}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Listed activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LISTED_ACTIVITIES.map((a) => (
                <div key={a.ref} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.ref}</span>
                    <Badge
                      variant={a.triggered === "yes" ? "secondary" : "destructive"}
                      className="rounded-full"
                    >
                      {a.triggered === "yes" ? "Triggered" : "To confirm"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {a.notice}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {a.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="fleet" className="space-y-4 pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How the fleet works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                A supervisor runs on a schedule. It reads the project's live
                state — stage, deadlines, document checklist, and the findings
                still open from previous runs — and decides which specialists are
                worth dispatching, with a narrow focus for each. It records what
                it deliberately skipped, so a human can disagree with the
                judgement rather than just the output.
              </p>
              <p>
                Each specialist answers exactly one question and must cite the
                document, clause and page behind every finding. Findings are
                deduplicated by fingerprint, so the same issue found on Monday
                and again on Friday updates one row instead of piling up — and
                anything a human dismisses stays dismissed.
              </p>
              <p className="text-foreground">
                Agents propose. They never act outward. Nothing is emailed,
                submitted or filed on an agent's reasoning alone.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            {AGENTS.map((a) => (
              <Card key={a.key}>
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{a.name}</p>
                    {a.key === "supervisor" && (
                      <Badge variant="secondary" className="rounded-full">
                        Orchestrator
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {a.key}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.role}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {a.cadence}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
  );
}

export const DILEX_HEADER = {
  title: "WML Mission Control",
  description: `Running the ${PROJECT.facility} licence application. Every figure is read from the actual submission pack.`,
  badge: PROJECT.routeLabel,
};
