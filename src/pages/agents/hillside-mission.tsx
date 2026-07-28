/**
 * Hillside — Section 24G Fine Appeal + Section 31L Compliance Notice.
 *
 * Two DFFE tracks run against one site here, and the tabs are arranged to keep
 * them apart, because conflating them is the specific mistake this file has
 * already made twice. "What DFFE wants" leads, because for the first time in
 * five months the Department has asked for something concrete and the ball is
 * on our side of the net.
 */
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  APPEAL_DEFECTS,
  DFFE_REQUEST,
  DOCUMENTS,
  ENTITY_NAMES,
  FINDINGS,
  FINE,
  HILLSIDE_AS_AT,
  PEOPLE,
  PROJECT,
  S31L,
  TIMELINE,
} from "@/lib/demo/hillside";
import { FindingCard, MissionTabs, Stat, daysBetween } from "./shared";

const TABS = [
  { value: "brief", label: "Brief" },
  { value: "request", label: "What DFFE wants" },
  { value: "fine", label: "The fine" },
  { value: "defects", label: "Appeal defects" },
  { value: "s31l", label: "Section 31L" },
  { value: "timeline", label: "Correspondence" },
  { value: "people", label: "Who's who" },
  { value: "documents", label: "Documents" },
];

const KIND_STYLES: Record<string, string> = {
  decision: "border-destructive/40 bg-destructive/5",
  risk: "border-destructive/40 bg-destructive/5",
  due: "border-amber-500/40 bg-amber-500/5",
  submitted: "border-border bg-muted/30",
  received: "border-emerald-500/30 bg-emerald-500/5",
  open: "border-dashed border-border bg-transparent",
};

const TRACK_STYLES: Record<string, string> = {
  S24G: "border-sky-500/40 text-sky-700 dark:text-sky-400",
  S31L: "border-destructive/40 text-destructive",
  Both: "border-border text-muted-foreground",
};

const REQUEST_STYLES: Record<string, string> = {
  outstanding: "border-destructive/40 bg-destructive/5",
  held: "border-emerald-500/30 bg-emerald-500/5",
  missing: "border-amber-500/40 bg-amber-500/5",
};

export function HillsideMission() {
  const critical = FINDINGS.filter((f) => f.severity === "critical");
  const high = FINDINGS.filter((f) => f.severity === "high");

  const daysSinceRequest = daysBetween("2026-07-17", HILLSIDE_AS_AT);
  const daysSinceEscalation = daysBetween("2026-04-08", HILLSIDE_AS_AT);
  const daysSinceAppeal = daysBetween("2026-02-11", HILLSIDE_AS_AT);
  const daysPastPayment = daysBetween("2026-03-22", HILLSIDE_AS_AT);

  return (
    <Tabs defaultValue="brief" className="gap-0">
      <MissionTabs tabs={TABS} />

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="brief" className="space-y-5 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Fine under appeal"
            value={FINE.amount}
            tone="bad"
            note={`${FINE.soughtOnAppeal} sought · ${FINE.atStake} at stake`}
          />
          <Stat
            label="DFFE request unanswered"
            value={`${daysSinceRequest} days`}
            tone="bad"
            note="Four items · three of them in our hands"
          />
          <Stat
            label="Enforcement track silent"
            value={`${daysSinceEscalation} days`}
            tone="bad"
            note="Since DFFE signalled the next step"
          />
          <Stat
            label="Appeal lodged"
            value={`${daysSinceAppeal} days ago`}
            tone="warn"
            note="Most of it on a blank form"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where this file stands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Hillside built wastewater lagoons for coal washing discards before
              it held a Waste Management Licence. A Section 24G rectification was
              lodged on 5 February 2025; on 21 January 2026 the Chief Director
              imposed an administrative fine of {FINE.amount} against a statutory
              ceiling of {FINE.ceiling}. The appeal to the Minister asks for{" "}
              {FINE.soughtOnAppeal}.
            </p>
            <p className="text-foreground">
              Two DFFE tracks run against this site, and they are not the same
              process. The appeal is about money. The Section 31L compliance
              notice is about a criminal offence under section 49A(1)(k) — and
              that notice has never been varied, objected to or withdrawn. The
              Department has said so twice, in almost those words.
            </p>
            <p>
              For five months the appeal went nowhere, because what was filed on
              11 February was a blank appeal form and a motivation on a letterhead
              bearing a company name DFFE does not recognise. On 17 July an appeal
              administrator was finally allocated and asked for four specific
              things. Three of them can be sent today.
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
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">
              Realeboga Tlhoaele, Appeals and Legal Review — 17 July 2026,{" "}
              {daysSinceRequest} days ago.
            </p>
            <p className="mt-1 text-muted-foreground">
              The first substantive movement on this appeal since it was lodged.
              Nothing has been sent to that address since 7 July.
            </p>
          </CardContent>
        </Card>

        {DFFE_REQUEST.map((r, i) => (
          <Card key={i} className={cn(REQUEST_STYLES[r.status])}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{r.item}</p>
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full text-[11px] capitalize"
                >
                  {r.status === "held"
                    ? "Ready to send"
                    : r.status === "missing"
                      ? "Not held"
                      : "Outstanding"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{r.note}</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              One name, before anything is sent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ENTITY_NAMES.map((e) => (
              <div
                key={e.name}
                className={cn(
                  "rounded-lg border px-4 py-2.5",
                  e.status === "wrong" && "border-destructive/40 bg-destructive/5",
                  e.status === "correct" && "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <p className="text-sm font-medium">{e.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.where}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="fine" className="space-y-4 pt-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-1 p-4">
            <p className="text-3xl font-medium tabular-nums">{FINE.amount}</p>
            <p className="text-sm text-muted-foreground">{FINE.words}</p>
            <p className="pt-1 text-sm">
              Imposed {FINE.decidedOn} by {FINE.decidedBy}. Statutory ceiling{" "}
              {FINE.ceiling}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{FINE.basis}</p>
            <p>
              <span className="text-foreground">Listed activities: </span>
              {PROJECT.listedActivities}
            </p>
            <p>
              <span className="text-foreground">Enquiries: </span>
              {FINE.enquiries}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Three clocks, all from the date of receipt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FINE.clocks.map((c) => (
              <div
                key={c.window}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0"
              >
                <span className="min-w-[4.5rem] text-sm font-medium tabular-nums">
                  {c.window}
                </span>
                <span className="min-w-[3rem] font-mono text-xs tabular-nums text-muted-foreground">
                  {c.by}
                </span>
                <span className="flex-1 text-sm text-muted-foreground">
                  {c.what}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-medium">
              Payment fell due around 22 March — {daysPastPayment} days ago.
            </p>
            <p className="text-muted-foreground">{FINE.consequence}</p>
            <p className="text-muted-foreground">
              The appeal was lodged on 11 February, inside the sixty days, so the
              saving condition was met on its face. That reading has never been
              put to the Department in writing.
            </p>
            <p className="text-muted-foreground">{FINE.gate}</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="defects" className="space-y-3 pt-6">
        <p className="text-sm text-muted-foreground">
          What was actually filed on 11 February 2026, and why the appeal sat
          untouched until the second follow-up copied the appeals inbox directly.
        </p>
        {APPEAL_DEFECTS.map((d, i) => (
          <Card key={i} className="border-destructive/30">
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium leading-snug">{d.defect}</p>
              <p className="text-sm text-muted-foreground">{d.detail}</p>
              <div className="rounded-md border border-dashed bg-muted/40 p-3">
                <p className="text-xs font-medium">Consequence</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {d.consequence}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="s31l" className="space-y-4 pt-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">{S31L.instrument}</p>
            <p className="mt-1 text-muted-foreground">{S31L.status}</p>
            <p className="mt-2 text-muted-foreground">
              The Section 24G process is separate from this notice and does not
              replace or suspend it. Waiting for the licensing track to finish
              before answering the notice is the reasoning the client gave DFFE on
              7 April, and it is the reasoning the Department rejected the next
              day.
            </p>
          </CardContent>
        </Card>

        {S31L.instructions.map((ins) => (
          <div key={ins.ref} className="rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full text-[11px]">
                {ins.ref}
              </Badge>
              <span className="text-sm font-medium">{ins.what}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{ins.state}</p>
          </div>
        ))}

        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">Open risk</p>
            <p className="mt-1 text-muted-foreground">{S31L.openRisk}</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="timeline" className="space-y-2 pt-6">
        <p className="pb-2 text-sm text-muted-foreground">
          Both tracks on one line. The badge says which one.
        </p>
        {TIMELINE.map((e, i) => (
          <div
            key={i}
            className={cn("rounded-lg border px-4 py-3", KIND_STYLES[e.kind])}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tabular-nums">{e.date}</span>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-[11px]",
                  TRACK_STYLES[e.track]
                )}
              >
                {e.track}
              </Badge>
              <span className="text-sm font-medium">{e.label}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
          </div>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="people" className="space-y-2 pt-6">
        {PEOPLE.map((p) => (
          <div key={p.name} className="rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.role}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
          </div>
        ))}
      </TabsContent>

      {/* ------------------------------------------------------------------ */}
      <TabsContent value="documents" className="space-y-2 pt-6">
        <p className="text-sm text-muted-foreground">
          Everything Silverline holds on this file, and the four things it does
          not.
        </p>
        {DOCUMENTS.map((d) => (
          <div
            key={d.name}
            className={cn(
              "rounded-lg border px-4 py-3",
              !d.held && "border-dashed border-amber-500/40 bg-amber-500/5"
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs">{d.name}</span>
              {!d.held && (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-500/40 text-[11px] text-amber-700 dark:text-amber-400"
                >
                  Not held
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{d.note}</p>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

export const HILLSIDE_HEADER = {
  title: "Enforcement & Appeal Mission Control",
  description: `${PROJECT.project} · ${PROJECT.site}. Ref ${PROJECT.reference}. Built from the mailbox, the project folders and the decision letter itself.`,
  badge: PROJECT.routeLabel,
};
