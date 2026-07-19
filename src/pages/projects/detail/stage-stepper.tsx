import { useActionState, useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimelineStatusBadge, DocReqStatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type {
  ProfileRow,
  ProjectDocumentRequirementRow,
  ProjectTimelineItemRow,
  TimelineStatus,
} from "@/lib/database.types";
import {
  updateStageDetails,
  updateStageStatusWithComment,
  type FormState,
} from "./wml-actions";

type Staff = Pick<ProfileRow, "id" | "full_name">;
const initialState: FormState = {};

/** Understated node on a continuous track: filled circle + slim tick = done,
 *  ringed + breathing = current, hollow = upcoming, dashed = skipped. */
function StageNode({ status, current }: { status: TimelineStatus; current: boolean }) {
  if (status === "completed") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Check className="size-3" strokeWidth={2.75} />
      </span>
    );
  }
  if (status === "skipped") {
    return <span className="size-5 rounded-full border border-dashed border-muted-foreground/40 bg-background" />;
  }
  if (current) {
    return (
      <span className="relative flex items-center justify-center">
        <span
          className="absolute inline-flex size-7 rounded-full bg-primary/15 animate-pulse"
          aria-hidden
        />
        <span className="relative flex size-5 items-center justify-center rounded-full border-2 border-primary bg-background">
          <span className="size-2 rounded-full bg-primary" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full border border-border bg-background">
      <span className="size-1.5 rounded-full bg-muted-foreground/25" />
    </span>
  );
}

/**
 * Presentational horizontal timeline — one continuous track filled up to the
 * current stage. Shared by the internal Overview (interactive, pass onSelectStage)
 * and the Customer View (read-only, omit onSelectStage). This is the same format
 * clients see in the portal, so it's the hero of the page.
 */
export function ProjectTimeline({
  items,
  progress,
  onSelectStage,
}: {
  items: ProjectTimelineItemRow[];
  progress: number;
  onSelectStage?: (id: string) => void;
}) {
  const done = items.filter((i) => i.status === "completed").length;
  const currentIdx = items.findIndex(
    (i) => i.status !== "completed" && i.status !== "skipped"
  );
  const current = currentIdx >= 0 ? items[currentIdx] : null;
  const filledPct =
    currentIdx >= 0 ? ((currentIdx + 0.5) / items.length) * 100 : 100;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No stages yet for this project.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Current stage
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">
            {current ? current.stage_name : "All stages complete"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {current
              ? `Stage ${currentIdx + 1} of ${items.length}`
              : `${items.length} of ${items.length}`}{" "}
            · {done} done
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xl font-semibold tabular-nums">{progress}%</span>
        </div>
      </div>

      <div className="overflow-x-auto py-1">
        <div className="relative min-w-max">
          {/* one continuous track, with the completed portion filled */}
          <div
            className="pointer-events-none absolute top-4 right-0 left-0 h-px -translate-y-1/2 bg-border"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-4 left-0 h-px -translate-y-1/2 bg-primary/60"
            style={{ width: `${filledPct}%` }}
            aria-hidden
          />
          <ol className="relative flex">
            {items.map((item, idx) => {
              const isCurrent = idx === currentIdx;
              const node = <StageNode status={item.status} current={isCurrent} />;
              return (
                <li
                  key={item.id}
                  className="flex w-[7.5rem] shrink-0 flex-col items-center px-1"
                >
                  <div className="flex h-8 items-center justify-center">
                    {onSelectStage ? (
                      <button
                        type="button"
                        onClick={() => onSelectStage(item.id)}
                        className="relative z-10 flex items-center justify-center rounded-full outline-none transition hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/50"
                        title={`${item.stage_name} — click to update`}
                      >
                        {node}
                      </button>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center">
                        {node}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-3 line-clamp-2 max-w-[7rem] text-center text-[11px] leading-snug",
                      isCurrent
                        ? "font-medium text-foreground"
                        : "text-muted-foreground/70"
                    )}
                  >
                    {item.stage_name}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive timeline for the internal Overview — the presentational
 * ProjectTimeline plus a per-stage manager (status change with a comment,
 * plus stage details).
 */
export function StageStepper({
  projectId,
  items,
  docReqs,
  staff,
  progress,
}: {
  projectId: string;
  items: ProjectTimelineItemRow[];
  docReqs: ProjectDocumentRequirementRow[];
  staff: Staff[];
  progress: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <>
      <ProjectTimeline items={items} progress={progress} onSelectStage={setSelectedId} />
      <StageManagerDialog
        key={selected?.id ?? "none"}
        projectId={projectId}
        item={selected}
        staff={staff}
        docReqs={docReqs}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

function StageManagerDialog({
  projectId,
  item,
  staff,
  docReqs,
  onClose,
}: {
  projectId: string;
  item: ProjectTimelineItemRow | null;
  staff: Staff[];
  docReqs: ProjectDocumentRequirementRow[];
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();
  const noop = async (_s: FormState, _f: FormData): Promise<FormState> => ({});
  const detailsAction = item
    ? updateStageDetails.bind(null, projectId, item.id)
    : noop;
  const [state, formAction, saving] = useActionState(detailsAction, initialState);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);

  if (!item) return null;

  const stageDocs = docReqs.filter((d) => d.linked_stage_key === item.stage_key);

  const setStatus = (status: TimelineStatus) =>
    start(async () => {
      const res = await updateStageStatusWithComment(projectId, item.id, status, comment);
      if (res.ok) {
        toast.success("Stage updated.");
        setComment("");
        onClose();
      } else {
        toast.error(res.error ?? "Could not update stage.");
      }
    });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {item.stage_name}
            <TimelineStatusBadge status={item.status} />
          </DialogTitle>
          {item.description && <DialogDescription>{item.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="stage-comment">Comment</Label>
          <Textarea
            id="stage-comment"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What happened at this stage? (optional)"
          />
          <p className="text-xs text-muted-foreground">
            Saved to the project notes with your name when you change the status.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {item.status !== "completed" && (
              <Button size="sm" disabled={pending} onClick={() => setStatus("completed")}>
                {pending && <Loader2 className="animate-spin" />}
                Mark complete
              </Button>
            )}
            {item.status === "pending" && (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("in_progress")}>
                Start
              </Button>
            )}
            {item.status === "completed" && (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("in_progress")}>
                Reopen
              </Button>
            )}
            {item.status !== "skipped" && item.status !== "completed" && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("skipped")}>
                Skip
              </Button>
            )}
            {item.status !== "pending" && item.status !== "completed" && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("pending")}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {stageDocs.length > 0 && (
          <div className="space-y-1.5 rounded-md border p-3">
            <p className="text-xs font-medium text-muted-foreground">Documents for this stage</p>
            <ul className="space-y-1">
              {stageDocs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">
                    {d.name}
                    {d.required && <span className="ml-1 text-destructive">*</span>}
                  </span>
                  <DocReqStatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <form action={formAction} className="space-y-4 border-t pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Responsible</Label>
              <Select name="assigned_to" defaultValue={item.assigned_to ?? ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-due">Due date</Label>
              <Input id="stage-due" name="due_date" type="date" defaultValue={item.due_date ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage-reqs">Completion requirements</Label>
            <Textarea
              id="stage-reqs"
              name="completion_requirements"
              rows={2}
              defaultValue={item.completion_requirements ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stage-notes">Internal notes</Label>
            <Textarea
              id="stage-notes"
              name="internal_notes"
              rows={2}
              defaultValue={item.internal_notes ?? ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="risk_flag"
              defaultChecked={item.risk_flag}
              className="size-4 accent-[var(--primary)]"
            />
            Flag this stage as a risk
          </label>
          <DialogFooter showCloseButton>
            <Button type="submit" size="sm" variant="outline" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save details
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
