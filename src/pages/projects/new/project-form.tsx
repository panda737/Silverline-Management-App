import { useActionState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
} from "@/lib/labels";
import { createProject, type CreateProjectState } from "../actions";

type Option = { id: string; label: string };

const initialState: CreateProjectState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-destructive">{errors[0]}</p>;
}

export function ProjectForm({
  clients,
  staff,
  defaultManagerId,
}: {
  clients: Option[];
  staff: Option[];
  defaultManagerId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createProject,
    initialState
  );
  const navigate = useNavigate();

  // SPA seam: the old server action redirect()ed; here the action returns the
  // destination and the form navigates.
  useEffect(() => {
    if (state.redirectTo) navigate(state.redirectTo, { replace: true });
  }, [state.redirectTo, navigate]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Vanderbijlpark Facility — Waste Management Licence"
              required
              aria-invalid={!!state.fieldErrors?.name}
            />
            <FieldError errors={state.fieldErrors?.name} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select name="client_id" required>
                <SelectTrigger aria-invalid={!!state.fieldErrors?.client_id}>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.client_id} />
            </div>
            <div className="space-y-2">
              <Label>Project type</Label>
              <Select name="project_type" required>
                <SelectTrigger aria-invalid={!!state.fieldErrors?.project_type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PROJECT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.project_type} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="not_started">
                <SelectTrigger>
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
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Project manager</Label>
              <Select name="manager_id" defaultValue={defaultManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Target date</Label>
              <Input id="target_date" name="target_date" type="date" />
              <FieldError errors={state.fieldErrors?.target_date} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Internal description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Internal notes about scope, history, risks. Never shown to the client."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_summary">Client summary</Label>
            <Textarea
              id="client_summary"
              name="client_summary"
              rows={3}
              placeholder="Shown to the client in their portal. Describe the project in client-friendly terms."
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Create project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
