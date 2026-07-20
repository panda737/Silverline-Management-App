import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
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
import { ProjectTimeline } from "@/components/project-timeline";
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

/**
 * Interactive timeline for the internal Overview — the shared ProjectTimeline
 * plus a per-stage manager (status change with a comment, and stage details).
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
