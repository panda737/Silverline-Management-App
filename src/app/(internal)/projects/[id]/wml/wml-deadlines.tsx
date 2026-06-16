"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeadlineStatusBadge } from "@/components/status-badge";
import { daysRemaining, deadlineStatusFor } from "@/lib/wml";
import type { ProjectDeadlineRow } from "@/lib/database.types";
import {
  deleteDeadline,
  upsertDeadline,
  type FormState,
} from "../wml-actions";

const initialState: FormState = {};

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

function daysLabel(due: string | null, completed: boolean) {
  if (completed) return "—";
  const days = daysRemaining(due);
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} overdue`;
  if (days === 0) return "Today";
  return `${days} days`;
}

export function WmlDeadlines({
  projectId,
  deadlines,
}: {
  projectId: string;
  deadlines: ProjectDeadlineRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Statutory and process deadlines. Dates are editable.
        </p>
        <DeadlineDialog projectId={projectId} />
      </div>
      {deadlines.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No deadlines yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="hidden md:table-cell">Trigger</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map((d) => {
                  const completed = d.status === "completed";
                  const status = completed
                    ? "completed"
                    : deadlineStatusFor(d.due_date, false);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.name}
                        {d.notes && (
                          <p className="text-xs font-normal text-muted-foreground">{d.notes}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {fmtDate(d.trigger_date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(d.due_date)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {daysLabel(d.due_date, completed)}
                      </TableCell>
                      <TableCell>
                        <DeadlineStatusBadge status={status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <DeadlineDialog projectId={projectId} deadline={d} />
                          <DeleteDeadlineButton projectId={projectId} id={d.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}

function DeadlineDialog({
  projectId,
  deadline,
}: {
  projectId: string;
  deadline?: ProjectDeadlineRow;
}) {
  const [open, setOpen] = useState(false);
  const action = upsertDeadline.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const editing = !!deadline;

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
      {editing ? (
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Edit deadline">
          <Pencil className="size-3.5" />
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />
          Add deadline
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit deadline" : "Add deadline"}</DialogTitle>
          <DialogDescription>Track a statutory or process deadline.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={deadline.id} />}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={deadline?.name ?? ""} required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trigger_date">Trigger date</Label>
              <Input
                id="trigger_date"
                name="trigger_date"
                type="date"
                defaultValue={deadline?.trigger_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={deadline?.due_date ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={deadline?.notes ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="completed"
              defaultChecked={deadline?.status === "completed"}
              className="size-4 accent-[var(--primary)]"
            />
            Mark as completed
          </label>
          <DialogFooter showCloseButton>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {editing ? "Save" : "Add deadline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDeadlineButton({ projectId, id }: { projectId: string; id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete deadline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteDeadline(projectId, id);
          if (res.ok) toast.success("Deadline removed.");
          else toast.error(res.error ?? "Could not delete.");
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
