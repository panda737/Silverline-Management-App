import { format } from "date-fns";
import {
  AlertCircle,
  Check,
  CircleDashed,
  Clock,
  Lightbulb,
  Users,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DILEX_CLIENT_AS_AT,
  CLIENT_PROJECT,
  STAGES,
  CLOCK,
  CONDITIONS,
  SCOPE,
  STUDIES,
  PARTICIPATION,
  CLIENT_OUTSTANDING,
  RECOMMENDED,
} from "@/lib/demo/dilex-client";

/**
 * The client-facing Elandsfontein page.
 *
 * Mission Control at /agents/dilex answers "what do we need to worry about".
 * This answers "where is my licence, what has the Department said, and what do
 * you need from me" — the only questions the client actually has.
 *
 * Everything it renders comes from lib/demo/dilex-client.ts, which is WRITTEN
 * for the client rather than filtered from the internal record. Read the header
 * of that file before adding anything here. In particular: no fees, and none of
 * our own corrections to our own record.
 */
export default function PortalDilexPage() {
  useDocumentTitle("Your application — Elandsfontein");

  const current = STAGES.find((s) => s.state === "current");
  const due = CLOCK.find((c) => c.kind === "due");
  const critical = CLIENT_OUTSTANDING.filter((o) => o.priority === "critical");

  /** Days to the deadline, computed at render so the page cannot go stale. */
  const daysToDue = due
    ? Math.round(
        (new Date(due.date).getTime() - Date.now()) / 86_400_000,
      )
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your Waste Management Licence application"
        description={`${CLIENT_PROJECT.facility} · ${CLIENT_PROJECT.property}`}
      />

      {/* Where the work is, in one sentence, before any detail. */}
      {current && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Where we are
            </p>
            <p className="mt-1 text-lg font-semibold">{current.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.detail}
            </p>
          </CardContent>
        </Card>
      )}

      {/* --- The brief ---------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "The work", value: CLIENT_PROJECT.work },
          { label: "Authority", value: CLIENT_PROJECT.authority },
          { label: "Reference", value: CLIENT_PROJECT.reference },
          { label: "Property", value: `${CLIENT_PROJECT.extent} · ${CLIENT_PROJECT.municipality}` },
        ].map((f) => (
          <Card key={f.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="mt-1 text-sm font-medium">{f.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- What we need from you ---------------------------------------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            What we need from you
          </h2>
          <p className="text-sm text-muted-foreground">
            {CLIENT_OUTSTANDING.length} items, {critical.length} of them holding
            something up. Each one says why it is needed — if something does not
            apply, telling us that is a complete answer.
          </p>
        </div>

        {CLIENT_OUTSTANDING.map((o) => (
          <Card
            key={o.item}
            className={cn(
              o.priority === "critical" && "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <CardContent className="flex items-start gap-3 p-4">
              {o.priority === "critical" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
              ) : (
                <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{o.item}</p>
                  {o.priority === "critical" && (
                    <Badge className="bg-amber-600 text-[11px] hover:bg-amber-600">
                      Blocking
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{o.why}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      {/* --- Stages ------------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          The stages of this work
        </h2>
        <div className="space-y-0">
          {STAGES.map((s, i) => (
            <div key={s.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    s.state === "done" &&
                      "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    s.state === "current" &&
                      "border-primary bg-primary/10 text-primary",
                    s.state === "next" && "border-border text-muted-foreground",
                  )}
                >
                  {s.state === "done" ? (
                    <Check className="size-3.5" />
                  ) : s.state === "current" ? (
                    <Clock className="size-3.5" />
                  ) : (
                    <CircleDashed className="size-3.5" />
                  )}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-6">
                <p className="font-medium leading-6">{s.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* --- The statutory clock ------------------------------------------ */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            The regulatory clock
          </h2>
          <p className="text-sm text-muted-foreground">
            What the regulations require, and by when.
          </p>
        </div>

        {due && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-5">
              <p className="text-2xl font-semibold tabular-nums">
                {format(new Date(due.date), "d MMMM yyyy")}
              </p>
              {daysToDue !== null && daysToDue > 0 && (
                <Badge variant="secondary">{daysToDue} days</Badge>
              )}
              <p className="w-full text-sm font-medium">{due.label}</p>
              <p className="w-full text-sm text-muted-foreground">
                {due.detail}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {CLOCK.filter((c) => c.kind === "done").map((c) => (
            <div key={c.date} className="flex gap-3">
              <p className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">
                {format(new Date(c.date), "d MMM yyyy")}
              </p>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-sm text-muted-foreground">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* --- The seven conditions ----------------------------------------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            The Department&rsquo;s seven conditions
          </h2>
          <p className="text-sm text-muted-foreground">
            Acceptance of the Scoping Report came with seven conditions. This is
            where each one stands.
          </p>
        </div>

        {CONDITIONS.map((c) => (
          <Card key={c.n}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums text-muted-foreground">
                {c.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{c.title}</p>
                  {c.state === "needs-client" && (
                    <Badge variant="secondary" className="text-[11px]">
                      Needs something from you
                    </Badge>
                  )}
                  {c.state === "in-hand" && (
                    <Badge variant="secondary" className="text-[11px]">
                      In hand
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.position}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      {/* --- Scope -------------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          What this licence covers
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Applied for
              </p>
              <ul className="mt-2 space-y-1.5">
                {SCOPE.inScope.map((s) => (
                  <li key={s} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Applied for separately, later
              </p>
              <ul className="mt-2 space-y-1.5">
                {SCOPE.outOfScope.map((s) => (
                  <li key={s} className="flex gap-2 text-sm">
                    <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                {SCOPE.pyrolysisNote}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SCOPE.capacity.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-sm font-medium">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{SCOPE.activities}</p>
      </section>

      <Separator />

      {/* --- Specialist studies ------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Specialist studies
        </h2>
        <p className="text-sm text-muted-foreground">{STUDIES.summary}</p>
        <p className="text-sm text-muted-foreground">{STUDIES.fourOpen}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {STUDIES.sensitivities.map((s) => (
            <Badge
              key={s.theme}
              variant="secondary"
              className="font-normal"
            >
              {s.theme}
              <span className="ml-1.5 text-muted-foreground">{s.level}</span>
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {STUDIES.sensitivityNote}
        </p>
      </section>

      <Separator />

      {/* --- Participation ------------------------------------------------ */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Public participation
          </h2>
          <Badge variant="secondary">
            {PARTICIPATION.registered} parties registered
          </Badge>
        </div>
        <ul className="space-y-1.5">
          {PARTICIPATION.points.map((p) => (
            <li key={p} className="flex gap-2 text-sm">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{PARTICIPATION.next}</p>
      </section>

      <Separator />

      {/* --- Recommendations that cost money ------------------------------ */}
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              What we recommend, and why
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            These are decisions for you rather than steps we can simply take.
            Two of the three protect you more than they protect the application.
          </p>
        </div>

        {RECOMMENDED.map((r) => (
          <Card key={r.title}>
            <CardContent className="p-4">
              <p className="font-medium">{r.title}</p>
              <p className="mt-1 text-sm">{r.what}</p>
              <p className="mt-2 text-sm text-muted-foreground">{r.why}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <p className="pt-2 text-xs text-muted-foreground">
        Position as at {format(new Date(DILEX_CLIENT_AS_AT), "d MMMM yyyy")} ·
        Environmental assessment practitioner: {CLIENT_PROJECT.eap} · Your
        contact: {CLIENT_PROJECT.contact}
      </p>
    </div>
  );
}
