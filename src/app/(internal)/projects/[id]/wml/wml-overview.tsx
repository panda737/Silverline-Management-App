"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, Pencil, Route as RouteIcon, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  PriorityBadge,
  ProjectStatusBadge,
  RiskBadge,
} from "@/components/status-badge";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/labels";
import {
  RISK_KEYS,
  RISK_LABELS,
  WML_ROUTES,
  WML_ROUTE_KEYS,
  daysRemaining,
  routeStages,
  resolveStageName,
} from "@/lib/wml";
import type { RiskLevel, WmlRoute } from "@/lib/database.types";
import { assignRoute, updateWmlOverview, type FormState } from "../wml-actions";
import type { WmlProject } from "./wml-project-detail";

const initialState: FormState = {};

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

function daysLabel(due: string | null) {
  const days = daysRemaining(due);
  if (days === null) return "—";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export function WmlOverview({
  project,
  riskLevel,
  riskReason,
  riskIsManual,
}: {
  project: WmlProject;
  riskLevel: RiskLevel;
  riskReason: string;
  riskIsManual: boolean;
}) {
  const route = project.route;

  if (!route) {
    return <RoutePicker projectId={project.id} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Overview</CardTitle>
          <div className="flex items-center gap-1.5">
            <ChangeRouteButton projectId={project.id} currentRoute={route} />
            <EditOverviewDialog
              project={project}
              route={route}
              riskLevel={riskLevel}
              riskIsManual={riskIsManual}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
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
          <Field label="Route" value={WML_ROUTES[route].label} />
          <Field label="Status" value={<ProjectStatusBadge status={project.status} />} />
        </dl>

        <Separator />

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field
            label="Current legal stage"
            value={resolveStageName(route, project.current_legal_stage)}
          />
          <Field label="Current step" value={project.current_step} />
          <Field label="Next action" value={project.next_action} />
          <Field
            label="Due date"
            value={
              <span>
                {fmtDate(project.due_date)}
                {project.due_date && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {daysLabel(project.due_date)}
                  </span>
                )}
              </span>
            }
          />
        </dl>

        <Separator />

        <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Risk</dt>
            <dd className="flex items-center gap-2">
              <RiskBadge level={riskLevel} />
              <PriorityBadge priority={project.priority} />
            </dd>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <dt className="text-xs text-muted-foreground">
              Risk reason{riskIsManual ? "" : " (auto)"}
            </dt>
            <dd className="text-sm">{riskReason}</dd>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoutePicker({ projectId }: { projectId: string }) {
  const [route, setRoute] = useState<WmlRoute | "">("");
  const [pending, start] = useTransition();

  function generate() {
    if (!route) return;
    start(async () => {
      const res = await assignRoute(projectId, route);
      if (res.ok) toast.success("Route applied — timeline generated.");
      else toast.error(res.error ?? "Could not apply route.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select application route</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the WML application route. This generates the correct timeline
          stages, document checklist and deadlines.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={route} onValueChange={(v) => setRoute(v as WmlRoute)}>
            <SelectTrigger className="w-full sm:w-96">
              <SelectValue placeholder="Select a route" />
            </SelectTrigger>
            <SelectContent>
              {WML_ROUTE_KEYS.map((r) => (
                <SelectItem key={r} value={r}>
                  {WML_ROUTES[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={generate} disabled={!route || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Generate timeline
          </Button>
        </div>
        {route && WML_ROUTES[route].note && (
          <p className="text-xs text-muted-foreground">{WML_ROUTES[route].note}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeRouteButton({
  projectId,
  currentRoute,
}: {
  projectId: string;
  currentRoute: WmlRoute;
}) {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState<WmlRoute>(currentRoute);
  const [pending, start] = useTransition();

  function apply() {
    start(async () => {
      const res = await assignRoute(projectId, route);
      if (res.ok) {
        toast.success("Route updated — timeline regenerated.");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Could not change route.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RouteIcon className="size-3.5" />
        Change route
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change application route</DialogTitle>
          <DialogDescription>
            Changing the route rebuilds the timeline stages, document checklist
            and deadlines from the template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Current stage progress, document statuses and deadlines for this
              project will be replaced.
            </span>
          </div>
          <div className="space-y-2">
            <Label>Route</Label>
            <Select value={route} onValueChange={(v) => setRoute(v as WmlRoute)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WML_ROUTE_KEYS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {WML_ROUTES[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button size="sm" onClick={apply} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditOverviewDialog({
  project,
  route,
  riskLevel,
  riskIsManual,
}: {
  project: WmlProject;
  route: WmlRoute;
  riskLevel: RiskLevel;
  riskIsManual: boolean;
}) {
  const [open, setOpen] = useState(false);
  const action = updateWmlOverview.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const stages = routeStages(route);

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
            Status, legal stage, next action and risk for this application.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="applicant">Applicant</Label>
              <Input id="applicant" name="applicant" defaultValue={project.applicant ?? ""} />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label>Current legal stage</Label>
            <Select name="current_legal_stage" defaultValue={project.current_legal_stage ?? ""}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Progress is derived from the selected legal stage.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_step">Current step</Label>
            <Input id="current_step" name="current_step" defaultValue={project.current_step ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_action">Next action</Label>
            <Textarea id="next_action" name="next_action" rows={2} defaultValue={project.next_action ?? ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={project.due_date ?? ""} />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Risk level</Label>
              <Select name="risk_level" defaultValue={riskIsManual ? riskLevel : "auto"}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Auto (derived)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (derived)</SelectItem>
                  {RISK_KEYS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RISK_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk_reason">Risk reason</Label>
              <Input
                id="risk_reason"
                name="risk_reason"
                defaultValue={riskIsManual ? project.risk_reason ?? "" : ""}
                placeholder="Leave blank to auto-derive"
              />
            </div>
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
