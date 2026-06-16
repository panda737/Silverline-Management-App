"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Eye,
  FileText,
  Loader2,
  TriangleAlert,
} from "lucide-react";
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
import type {
  ProfileRow,
  ProjectDocumentRequirementRow,
  ProjectTimelineItemRow,
  TimelineStatus,
} from "@/lib/database.types";
import {
  setStageStatus,
  updateStageDetails,
  type FormState,
} from "../wml-actions";

type Staff = Pick<ProfileRow, "id" | "full_name">;

const initialState: FormState = {};

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

function StageIcon({ status }: { status: TimelineStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-5 text-primary" />;
    case "in_progress":
      return <CircleDot className="size-5 text-emerald-500" />;
    default:
      return <Circle className="size-5 text-muted-foreground/40" />;
  }
}

export function WmlTimeline({
  projectId,
  items,
  docReqs,
  staff,
}: {
  projectId: string;
  items: ProjectTimelineItemRow[];
  docReqs: ProjectDocumentRequirementRow[];
  staff: Staff[];
}) {
  const staffName = (id: string | null) =>
    staff.find((s) => s.id === id)?.full_name ?? null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Route-generated stages. A stage cannot be completed while a required
        document is missing.
      </p>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No timeline stages yet.
        </p>
      ) : (
        <ol className="space-y-0">
            {items.map((item, idx) => {
              const stageDocs = docReqs.filter(
                (d) => d.linked_stage_key === item.stage_key
              );
              const required = stageDocs.filter((d) => d.required);
              const uploaded = stageDocs.filter(
                (d) => d.status === "uploaded" || d.status === "approved"
              );
              return (
                <li key={item.id} className="relative flex gap-3 pb-6">
                  {idx < items.length - 1 && (
                    <span
                      className="absolute top-6 left-[9px] h-full w-px bg-border"
                      aria-hidden
                    />
                  )}
                  <div className="relative z-10 bg-card">
                    <StageIcon status={item.status} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.stage_name}</p>
                      <TimelineStatusBadge status={item.status} />
                      {item.risk_flag && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <TriangleAlert className="size-3.5" /> Risk
                        </span>
                      )}
                      {item.client_visible && (
                        <Eye className="size-3.5 text-muted-foreground" aria-label="Client visible" />
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Responsible: {staffName(item.assigned_to) ?? "—"}</span>
                      <span>
                        {item.status === "completed"
                          ? `Completed ${fmtDate(item.completed_date)}`
                          : `Due ${fmtDate(item.due_date)}`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3.5" />
                        {uploaded.length}/{required.length} required docs
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.status !== "completed" && (
                        <MarkCompleteButton projectId={projectId} itemId={item.id} />
                      )}
                      {item.status === "pending" && (
                        <StatusButton
                          projectId={projectId}
                          itemId={item.id}
                          status="in_progress"
                          label="Start"
                        />
                      )}
                      {item.status !== "pending" && item.status !== "completed" && (
                        <StatusButton
                          projectId={projectId}
                          itemId={item.id}
                          status="pending"
                          label="Reset"
                          variant="ghost"
                        />
                      )}
                      {item.status === "completed" && (
                        <StatusButton
                          projectId={projectId}
                          itemId={item.id}
                          status="in_progress"
                          label="Reopen"
                          variant="ghost"
                        />
                      )}
                      <StageDetailsDialog
                        projectId={projectId}
                        item={item}
                        staff={staff}
                        stageDocs={stageDocs}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
  );
}

function MarkCompleteButton({
  projectId,
  itemId,
}: {
  projectId: string;
  itemId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="xs"
      onClick={() =>
        start(async () => {
          const res = await setStageStatus(projectId, itemId, "completed");
          if (res.ok) toast.success("Stage completed.");
          else toast.error(res.error ?? "Could not complete stage.");
        })
      }
      disabled={pending}
    >
      {pending && <Loader2 className="animate-spin" />}
      Mark complete
    </Button>
  );
}

function StatusButton({
  projectId,
  itemId,
  status,
  label,
  variant = "outline",
}: {
  projectId: string;
  itemId: string;
  status: TimelineStatus;
  label: string;
  variant?: "outline" | "ghost";
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="xs"
      variant={variant}
      onClick={() =>
        start(async () => {
          const res = await setStageStatus(projectId, itemId, status);
          if (!res.ok) toast.error(res.error ?? "Could not update stage.");
        })
      }
      disabled={pending}
    >
      {pending && <Loader2 className="animate-spin" />}
      {label}
    </Button>
  );
}

function StageDetailsDialog({
  projectId,
  item,
  staff,
  stageDocs,
}: {
  projectId: string;
  item: ProjectTimelineItemRow;
  staff: Staff[];
  stageDocs: ProjectDocumentRequirementRow[];
}) {
  const [open, setOpen] = useState(false);
  const action = updateStageDetails.bind(null, projectId, item.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="xs" variant="ghost" onClick={() => setOpen(true)}>
        View details
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.stage_name}</DialogTitle>
          {item.description && <DialogDescription>{item.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Documents for this stage</p>
          {stageDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked documents.</p>
          ) : (
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
          )}
        </div>

        <form action={formAction} className="space-y-4">
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
              <Label htmlFor={`due_${item.id}`}>Due date</Label>
              <Input
                id={`due_${item.id}`}
                name="due_date"
                type="date"
                defaultValue={item.due_date ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`reqs_${item.id}`}>Completion requirements</Label>
            <Textarea
              id={`reqs_${item.id}`}
              name="completion_requirements"
              rows={2}
              defaultValue={item.completion_requirements ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes_${item.id}`}>Notes</Label>
            <Textarea
              id={`notes_${item.id}`}
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
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
