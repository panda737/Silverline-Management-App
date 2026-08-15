/**
 * Section 24G Mission Control — the client's side.
 *
 * Deliberately the same shape as the staff mission pages, and deliberately a
 * different document. The staff missions are written to be brutal with
 * ourselves: they carry our procedural exposure, our legal argument and our
 * assessment of the client's own answers. None of that belongs here.
 *
 * What belongs here is the applicant's own information, asserted back to him
 * with its provenance, so he can confirm it or tell us it is wrong. Half the
 * trouble on a rectification is facts nobody checked with the one person who
 * actually knows.
 *
 * Two rules this file keeps:
 *   1. It reads live data only. The staff missions read a fixture; showing a
 *      client a fixture would be a second source of truth aimed at the person
 *      least able to check it.
 *   2. The Commencement section is NOT rendered. Those dates drive the fine,
 *      and the applicant is not being asked to confirm them until the risk has
 *      been put to him properly, in writing.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Check,
  CircleAlert,
  FileText,
  Inbox,
  ListChecks,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MissionTabs, Stat } from "@/pages/agents/shared";
import { cn } from "@/lib/utils";
import type { PortalFactRow } from "@/lib/database.types";

/** Commencement is built but withheld — see the file header. */
const TABS = [
  { value: "brief", label: "Brief" },
  { value: "operation", label: "Operation" },
  { value: "outstanding", label: "What we need" },
  { value: "evidence", label: "Documents held" },
];

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

/* -------------------------------------------------------------------------- */

/** One asserted fact, with the client's confirm / dispute control. */
function FactRow({ fact, projectId }: { fact: PortalFactRow; projectId: string }) {
  const qc = useQueryClient();
  const [disputing, setDisputing] = useState(false);
  const [comment, setComment] = useState("");

  const respond = useMutation({
    mutationFn: async (input: { state: "confirmed" | "disputed"; comment?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("project_fact_responses").insert({
        fact_id: fact.id,
        project_id: projectId,
        state: input.state,
        comment: input.comment?.trim() || null,
        responded_by: auth.user?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, input) => {
      setDisputing(false);
      setComment("");
      toast.success(
        input.state === "confirmed"
          ? "Confirmed — thank you."
          : "Thank you. We have flagged that and will come back to you."
      );
      void qc.invalidateQueries({ queryKey: ["portal", "facts", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const state = fact.response_state;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-4",
        state === "confirmed" && "border-emerald-500/30 bg-emerald-500/5",
        state === "disputed" && "border-amber-500/40 bg-amber-500/5",
        !state && "border-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">{fact.label}</p>
          <p className="text-sm font-medium">{fact.value ?? "—"}</p>
          {fact.source_note && (
            <p className="text-xs text-muted-foreground">From {fact.source_note}</p>
          )}
        </div>

        {state === "confirmed" ? (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Check className="size-3" />
            Confirmed {fmtDate(fact.responded_at)}
          </Badge>
        ) : state === "disputed" ? (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <CircleAlert className="size-3" />
            You flagged this
          </Badge>
        ) : fact.confirmable ? (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={respond.isPending}
              onClick={() => respond.mutate({ state: "confirmed" })}
            >
              <Check className="size-3.5" />
              Correct
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={respond.isPending}
              onClick={() => setDisputing((v) => !v)}
            >
              <Pencil className="size-3.5" />
              Not right
            </Button>
          </div>
        ) : null}
      </div>

      {state === "disputed" && fact.response_comment && (
        <p className="rounded-md bg-background/60 p-3 text-sm whitespace-pre-wrap">
          {fact.response_comment}
        </p>
      )}

      {disputing && !state && (
        <div className="space-y-2 pt-1">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What should it say instead? Anything you can tell us helps — a date, a number, or just what is wrong with it."
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={respond.isPending || !comment.trim()}
              onClick={() => respond.mutate({ state: "disputed", comment })}
            >
              Send correction
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDisputing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  facts,
  projectId,
  empty,
}: {
  facts: PortalFactRow[];
  projectId: string;
  empty: string;
}) {
  if (facts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {empty}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {facts.map((f) => (
        <FactRow key={f.id} fact={f} projectId={projectId} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function PortalMission({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const { data: facts = [], isPending } = useQuery({
    queryKey: ["portal", "facts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_facts")
        .select("*")
        .eq("project_id", projectId)
        .order("section")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as PortalFactRow[];
    },
  });

  const bySection = useMemo(() => {
    // Commencement is filtered out here as well as being withheld server-side,
    // so that promoting a row by mistake cannot surface it.
    const visible = facts.filter((f) => f.section !== "commencement");
    return {
      operation: visible.filter((f) => f.section === "operation"),
      outstanding: visible.filter((f) => f.section === "outstanding"),
      evidence: visible.filter((f) => f.section === "evidence"),
      awaiting: visible.filter((f) => f.confirmable && !f.response_state).length,
      flagged: visible.filter((f) => f.response_state === "disputed").length,
      confirmed: visible.filter((f) => f.response_state === "confirmed").length,
    };
  }, [facts]);

  if (isPending) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-medium tracking-tight">
          Section 24G Mission Control
        </h2>
        <p className="text-sm text-muted-foreground">
          What we hold on {projectName}, and where we still need you. Anything
          below that is wrong, say so — it is quicker to fix here than in a
          letter.
        </p>
      </div>

      <Tabs defaultValue="brief" className="gap-0">
        <MissionTabs tabs={TABS} />

        <TabsContent value="brief" className="space-y-5 pt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Awaiting your confirmation"
              value={String(bySection.awaiting)}
              note={bySection.awaiting === 0 ? "Nothing outstanding" : "Please check these"}
            />
            <Stat
              label="Confirmed by you"
              value={String(bySection.confirmed)}
              note="On the record"
            />
            <Stat
              label="You have flagged"
              value={String(bySection.flagged)}
              note={bySection.flagged === 0 ? "None" : "We are dealing with these"}
            />
          </div>

          <Card>
            <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
              <p className="text-foreground">
                This page is the working record of your application, as we hold
                it.
              </p>
              <p>
                Everything on the Operation tab is something we will put in the
                application, so it needs to be right. Each item says where we
                got it. If a figure has moved, or we have misunderstood
                something, use <span className="text-foreground">Not right</span>{" "}
                and tell us — it comes straight to the team working on the file.
              </p>
              <p>
                <span className="text-foreground">What we need</span> lists what
                is still outstanding from your side, and{" "}
                <span className="text-foreground">Documents held</span> shows
                what we have received.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operation" className="pt-6">
          <Section
            facts={bySection.operation}
            projectId={projectId}
            empty="Nothing to confirm here yet. As we build the application, the facts we intend to rely on will appear here for you to check."
          />
        </TabsContent>

        <TabsContent value="outstanding" className="pt-6">
          <Section
            facts={bySection.outstanding}
            projectId={projectId}
            empty="Nothing outstanding from you at the moment."
          />
        </TabsContent>

        <TabsContent value="evidence" className="pt-6">
          <Section
            facts={bySection.evidence}
            projectId={projectId}
            empty="No documents recorded yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Icons kept referenced so the tab set stays self-documenting. */
export const MISSION_ICONS = { ListChecks, Inbox, FileText };
