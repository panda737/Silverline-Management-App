import { useActionState, useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/labels";
import type { ProjectTimelineItemRow } from "@/lib/database.types";
import { updateGenericOverview, type FormState } from "./wml-actions";
import type { ProjectWithRelations } from "./project-detail";

const initialState: FormState = {};

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

/**
 * Overview for non-WML projects. Uses the same card/tab skeleton and field
 * layout as the WML overview, but shows only the columns that apply to every
 * project type (no route, legal stage, or NEMWA listed activities). Editable
 * via the same Edit button — non-WML projects have no route, so there is no
 * Change route button here.
 */
export function GenericOverview({
  project,
  items,
}: {
  project: ProjectWithRelations;
  items: ProjectTimelineItemRow[];
}) {
  const currentStage = items.find(
    (i) => i.status !== "completed" && i.status !== "skipped"
  );
  const nextStage = currentStage
    ? items.find(
        (i) =>
          i.sort_order > currentStage.sort_order &&
          i.status !== "completed" &&
          i.status !== "skipped"
      )
    : undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-1.5">
        <EditGenericDialog project={project} />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2.5" />
      </div>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Client" value={project.client?.company_name} />
        <Field label="Applicant" value={project.applicant} />
        <Field label="Project manager" value={project.manager?.full_name ?? "Unassigned"} />
        <Field label="Project type" value={PROJECT_TYPE_LABELS[project.project_type]} />
        <Field label="Status" value={<ProjectStatusBadge status={project.status} />} />
        <Field label="Priority" value={<PriorityBadge priority={project.priority} />} />
      </dl>

      <Separator />

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Current stage" value={currentStage?.stage_name ?? "All stages completed"} />
        <Field label="Next step" value={nextStage?.stage_name} />
        <Field label="Current step" value={project.current_step} />
        <Field label="Next action" value={project.next_action} />
        <Field label="Start date" value={fmtDate(project.start_date)} />
        <Field label="Target date" value={fmtDate(project.target_date)} />
      </dl>

      {(project.client_summary || project.description) && <Separator />}

      {project.client_summary && (
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Client summary</dt>
          <dd className="text-sm">{project.client_summary}</dd>
        </div>
      )}
      {project.description && (
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">Internal description</dt>
          <dd className="text-sm">{project.description}</dd>
        </div>
      )}
    </div>
  );
}

function EditGenericDialog({ project }: { project: ProjectWithRelations }) {
  const [open, setOpen] = useState(false);
  const action = updateGenericOverview.bind(null, project.id);
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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" />
        Edit
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit overview</DialogTitle>
          <DialogDescription>
            Status, progress, next steps and dates for this project.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="applicant">Applicant</Label>
              <Input id="applicant" name="applicant" defaultValue={project.applicant ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                name="progress"
                type="number"
                min={0}
                max={100}
                defaultValue={project.progress}
              />
              {state.fieldErrors?.progress && (
                <p className="text-sm text-destructive">{state.fieldErrors.progress[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={project.status}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select name="priority" defaultValue={project.priority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_step">Current step</Label>
            <Input id="current_step" name="current_step" defaultValue={project.current_step ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_action">Next action</Label>
            <Textarea id="next_action" name="next_action" rows={2} defaultValue={project.next_action ?? ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={project.start_date ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Target date</Label>
              <Input id="target_date" name="target_date" type="date" defaultValue={project.target_date ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={project.due_date ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_summary">Client summary</Label>
            <Textarea
              id="client_summary"
              name="client_summary"
              rows={2}
              defaultValue={project.client_summary ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Internal description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={project.description ?? ""}
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter showCloseButton>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
