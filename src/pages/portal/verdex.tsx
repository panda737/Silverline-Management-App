import { format } from "date-fns";
import {
  Check,
  CircleDashed,
  Clock,
  FileText,
  Loader2,
  Mail,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  VERDEX_CLIENT_AS_AT,
  CLIENT_PROJECT,
  STAGES,
  MILESTONES,
  CLIENT_OUTSTANDING,
  CONFIRMED_WITH_CLIENT,
} from "@/lib/demo/verdex-client";

/**
 * The client-facing Verdex page.
 *
 * Mission Control answers "what do we need to worry about". This answers "where
 * is my application and what do you need from me" — which is the only question
 * the client actually has, and the one an email thread answers badly.
 *
 * Everything it renders comes from lib/demo/verdex-client.ts, which is written
 * for the client rather than filtered from the internal record. See the header
 * of that file before adding anything here.
 */
export default function PortalVerdexPage() {
  useDocumentTitle("Your application — Verdex");

  const waiting = CLIENT_OUTSTANDING.filter((o) => o.status === "waiting");
  const inProgress = CLIENT_OUTSTANDING.filter((o) => o.status === "in-progress");
  const current = STAGES.find((s) => s.state === "current");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your environmental applications"
        description={`${CLIENT_PROJECT.facility} · ${CLIENT_PROJECT.address}`}
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">The work</p>
            <p className="mt-1 text-sm font-medium">{CLIENT_PROJECT.work}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Waste authority</p>
            <p className="mt-1 text-sm font-medium">{CLIENT_PROJECT.waste}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Air authority</p>
            <p className="mt-1 text-sm font-medium">{CLIENT_PROJECT.air}</p>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            What we need from you
          </h2>
          <p className="text-sm text-muted-foreground">
            {waiting.length} item{waiting.length === 1 ? "" : "s"} outstanding
            {inProgress.length > 0 && `, ${inProgress.length} already underway`}.
            Each one says why it is needed — if something does not apply, telling
            us that is a complete answer.
          </p>
        </div>

        {CLIENT_OUTSTANDING.map((o) => (
          <Card key={o.item}>
            <CardContent className="flex items-start gap-3 p-4">
              {o.status === "in-progress" ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{o.item}</p>
                  {o.status === "in-progress" && (
                    <Badge variant="secondary" className="text-[11px]">
                      You said this is coming
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

      {/* ---------------------------------------------------------------- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          The stages of this work
        </h2>
        <div className="space-y-0">
          {STAGES.map((s, i) => (
            <div key={s.label} className="flex gap-3">
              {/* Rail: a dot per stage, joined by a line except at the end. */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    s.state === "done" &&
                      "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    s.state === "current" &&
                      "border-primary bg-primary/10 text-primary",
                    s.state === "next" && "border-border text-muted-foreground"
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
              <div className="pb-6">
                <p
                  className={cn(
                    "font-medium",
                    s.state === "next" && "text-muted-foreground"
                  )}
                >
                  {s.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ---------------------------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Progress so far</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {MILESTONES.map((m) => (
                <div key={m.date + m.label} className="flex gap-3 p-4">
                  <span className="w-24 shrink-0 text-sm text-muted-foreground">
                    {format(new Date(m.date), "d MMM yyyy")}
                  </span>
                  <span className="text-sm">{m.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          {/*
            Their own information, read back to them. It shows their answers
            landed somewhere, and it is the cheapest way to catch a wrong figure
            before it reaches an authority.
          */}
          <h2 className="text-lg font-semibold tracking-tight">
            Confirmed with you
          </h2>
          <Card>
            <CardContent className="divide-y p-0">
              {CONFIRMED_WITH_CLIENT.map((c) => (
                <div
                  key={c.label}
                  className="flex flex-wrap items-baseline justify-between gap-2 p-4"
                >
                  <span className="text-sm text-muted-foreground">
                    {c.label}
                  </span>
                  <span className="text-sm font-medium">{c.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            If any of these is wrong, tell us — they go into the application as
            they stand.
          </p>
        </section>
      </div>

      <Card className="bg-muted/40">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <span className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            {CLIENT_PROJECT.contact}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <FileText className="size-4" />
            Updated {format(new Date(VERDEX_CLIENT_AS_AT), "d MMMM yyyy")}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
