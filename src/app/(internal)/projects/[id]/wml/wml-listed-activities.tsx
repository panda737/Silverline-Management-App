"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityTriggeredBadge } from "@/components/status-badge";
import { ACTIVITY_TRIGGERED_KEYS, ACTIVITY_TRIGGERED_LABELS } from "@/lib/wml";
import type { ProjectListedActivityRow } from "@/lib/database.types";
import {
  deleteListedActivity,
  upsertListedActivity,
  type FormState,
} from "../wml-actions";

const initialState: FormState = {};

export function WmlListedActivities({
  projectId,
  activities,
}: {
  projectId: string;
  activities: ProjectListedActivityRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Listed Activities</CardTitle>
            <CardDescription>
              NEMWA listed activities triggered by this project.
            </CardDescription>
          </div>
          <ActivityDialog projectId={projectId} />
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No listed activities captured. At least one is required before Legal
            Activity Screening can be completed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden lg:table-cell">Waste stream</TableHead>
                  <TableHead className="hidden lg:table-cell">Capacity</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {a.activity_number}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {a.category ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-72 text-muted-foreground">
                      {a.description ?? "—"}
                      {a.threshold && (
                        <p className="text-xs">Threshold: {a.threshold}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {a.waste_stream ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {a.project_capacity ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ActivityTriggeredBadge value={a.triggered} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <ActivityDialog projectId={projectId} activity={a} />
                        <DeleteActivityButton projectId={projectId} id={a.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityDialog({
  projectId,
  activity,
}: {
  projectId: string;
  activity?: ProjectListedActivityRow;
}) {
  const [open, setOpen] = useState(false);
  const action = upsertListedActivity.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const editing = !!activity;

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
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Edit activity">
          <Pencil className="size-3.5" />
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />
          Add activity
        </Button>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit activity" : "Add listed activity"}</DialogTitle>
          <DialogDescription>
            Descriptions are free text — capture the wording that applies.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={activity.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="activity_number">Activity number</Label>
              <Input
                id="activity_number"
                name="activity_number"
                placeholder="B(2)"
                defaultValue={activity?.activity_number ?? ""}
                required
              />
              {state.fieldErrors?.activity_number && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.activity_number[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={activity?.category ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={activity?.description ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="waste_stream">Waste stream</Label>
              <Input id="waste_stream" name="waste_stream" defaultValue={activity?.waste_stream ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input id="threshold" name="threshold" defaultValue={activity?.threshold ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_capacity">Project capacity</Label>
              <Input
                id="project_capacity"
                name="project_capacity"
                defaultValue={activity?.project_capacity ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Triggered</Label>
              <Select name="triggered" defaultValue={activity?.triggered ?? "tbc"}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TRIGGERED_KEYS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACTIVITY_TRIGGERED_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={activity?.notes ?? ""} />
          </div>
          <DialogFooter showCloseButton>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {editing ? "Save" : "Add activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteActivityButton({ projectId, id }: { projectId: string; id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete activity"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteListedActivity(projectId, id);
          if (res.ok) toast.success("Activity removed.");
          else toast.error(res.error ?? "Could not delete.");
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}
