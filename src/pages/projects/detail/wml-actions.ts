import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/labels";
import {
  ACTIVITY_TRIGGERED_KEYS,
  DOC_REQ_STATUS_KEYS,
  RISK_KEYS,
  WML_ROUTE_KEYS,
  deadlineStatusFor,
  deadlinesForRoute,
  documentsForRoute,
  routeStages,
  stageWeight,
} from "@/lib/wml";
import type { WmlRoute } from "@/lib/database.types";

export type ActionResult = { ok: boolean; error?: string };
export type FormState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireEditor() {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return null;
  }
  return profile;
}

function invalidateProject(projectId: string) {
  queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  queryClient.invalidateQueries({ queryKey: ["projects"] });
}

function isoOffset(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

// ---------------------------------------------------------------------------
// Route assignment — (re)generates timeline, document checklist and deadlines.
// ---------------------------------------------------------------------------
export async function assignRoute(
  projectId: string,
  route: WmlRoute
): Promise<ActionResult> {
  const profile = await requireEditor();
  if (!profile) return { ok: false, error: "You do not have permission to edit this project." };
  if (!WML_ROUTE_KEYS.includes(route)) return { ok: false, error: "Invalid route." };

  const stages = routeStages(route);
  if (stages.length === 0) return { ok: false, error: "No stages defined for this route." };

  // Replace any existing generated rows.
  await supabase.from("project_timeline_items").delete().eq("project_id", projectId);
  await supabase.from("project_document_requirements").delete().eq("project_id", projectId);
  await supabase.from("project_deadlines").delete().eq("project_id", projectId);

  const items = stages.map((s, i) => ({
    project_id: projectId,
    stage_key: s.key,
    stage_name: s.name,
    description: s.description,
    client_visible: s.clientVisible,
    sort_order: i + 1,
    status: (i === 0 ? "in_progress" : "pending") as never,
  }));
  const { error: itemsError } = await supabase.from("project_timeline_items").insert(items);
  if (itemsError) return { ok: false, error: `Timeline generation failed: ${itemsError.message}` };

  const docs = documentsForRoute(route).map((d, i) => ({
    project_id: projectId,
    doc_key: d.key,
    name: d.name,
    linked_stage_key: d.linkedStageKey,
    required: d.required,
    status: "missing" as never,
    sort_order: i + 1,
  }));
  if (docs.length > 0) {
    const { error } = await supabase.from("project_document_requirements").insert(docs);
    if (error) return { ok: false, error: `Document checklist generation failed: ${error.message}` };
  }

  const deadlines = deadlinesForRoute(route).map((d, i) => {
    const due = isoOffset(d.offsetDays);
    return {
      project_id: projectId,
      deadline_key: d.key,
      name: d.name,
      linked_stage_key: d.linkedStageKey,
      trigger_date: isoOffset(0),
      due_date: due,
      status: deadlineStatusFor(due, false) as never,
      sort_order: i + 1,
    };
  });
  if (deadlines.length > 0) {
    const { error } = await supabase.from("project_deadlines").insert(deadlines);
    if (error) return { ok: false, error: `Deadline generation failed: ${error.message}` };
  }

  const first = stages[0];
  const { error: projError } = await supabase
    .from("projects")
    .update({
      route: route as never,
      current_legal_stage: first.key,
      current_step: first.name,
      progress: first.weight,
    })
    .eq("id", projectId);
  if (projError) return { ok: false, error: `Could not set route: ${projError.message}` };

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: profile.id,
    action: "wml_route_assigned",
    details: { route },
  });

  invalidateProject(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Overview edit
// ---------------------------------------------------------------------------
const overviewSchema = z.object({
  applicant: optionalText,
  current_legal_stage: optionalText,
  current_step: optionalText,
  next_action: optionalText,
  due_date: optionalDate,
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]),
  priority: z.enum(PRIORITIES as [string, ...string[]]),
  risk_level: z
    .enum(RISK_KEYS as [string, ...string[]])
    .or(z.literal("auto"))
    .or(z.literal(""))
    .optional()
    .transform((v) => (v && v !== "auto" ? v : null)),
  risk_reason: optionalText,
});

export async function updateWmlOverview(
  projectId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireEditor();
  if (!profile) return { error: "You do not have permission to edit this project." };

  const parsed = overviewSchema.safeParse({
    applicant: formData.get("applicant") ?? "",
    current_legal_stage: formData.get("current_legal_stage") ?? "",
    current_step: formData.get("current_step") ?? "",
    next_action: formData.get("next_action") ?? "",
    due_date: formData.get("due_date") ?? "",
    status: formData.get("status"),
    priority: formData.get("priority"),
    risk_level: formData.get("risk_level") ?? "",
    risk_reason: formData.get("risk_reason") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"] };
  }
  const input = parsed.data;

  const { data: project } = await supabase
    .from("projects")
    .select("route")
    .eq("id", projectId)
    .maybeSingle();
  const route = (project?.route ?? null) as WmlRoute | null;

  const { error } = await supabase
    .from("projects")
    .update({
      applicant: input.applicant,
      current_legal_stage: input.current_legal_stage,
      current_step: input.current_step,
      next_action: input.next_action,
      due_date: input.due_date,
      status: input.status as never,
      priority: input.priority as never,
      risk_level: input.risk_level as never,
      risk_reason: input.risk_reason,
      progress: stageWeight(route, input.current_legal_stage),
    })
    .eq("id", projectId);
  if (error) return { error: `Could not save: ${error.message}` };

  invalidateProject(projectId);
  return { success: "Overview updated." };
}

// ---------------------------------------------------------------------------
// Overview edit — non-WML projects (no route / legal stage / risk derivation)
// ---------------------------------------------------------------------------
const genericOverviewSchema = z.object({
  applicant: optionalText,
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]),
  priority: z.enum(PRIORITIES as [string, ...string[]]),
  progress: z.coerce.number().int().min(0).max(100),
  current_step: optionalText,
  next_action: optionalText,
  start_date: optionalDate,
  target_date: optionalDate,
  due_date: optionalDate,
  client_summary: optionalText,
  description: optionalText,
});

export async function updateGenericOverview(
  projectId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireEditor();
  if (!profile) return { error: "You do not have permission to edit this project." };

  const parsed = genericOverviewSchema.safeParse({
    applicant: formData.get("applicant") ?? "",
    status: formData.get("status"),
    priority: formData.get("priority"),
    progress: formData.get("progress") ?? "0",
    current_step: formData.get("current_step") ?? "",
    next_action: formData.get("next_action") ?? "",
    start_date: formData.get("start_date") ?? "",
    target_date: formData.get("target_date") ?? "",
    due_date: formData.get("due_date") ?? "",
    client_summary: formData.get("client_summary") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"] };
  }
  const input = parsed.data;

  const { error } = await supabase
    .from("projects")
    .update({
      applicant: input.applicant,
      status: input.status as never,
      priority: input.priority as never,
      progress: input.progress,
      current_step: input.current_step,
      next_action: input.next_action,
      start_date: input.start_date,
      target_date: input.target_date,
      due_date: input.due_date,
      client_summary: input.client_summary,
      description: input.description,
    })
    .eq("id", projectId);
  if (error) return { error: `Could not save: ${error.message}` };

  invalidateProject(projectId);
  return { success: "Overview updated." };
}

// ---------------------------------------------------------------------------
// Timeline stage status (with completion gating)
// ---------------------------------------------------------------------------
export async function setStageStatus(
  projectId: string,
  itemId: string,
  status: "pending" | "in_progress" | "completed" | "skipped"
): Promise<ActionResult> {
  const profile = await requireEditor();
  if (!profile) return { ok: false, error: "You do not have permission to edit this project." };

  const { data: item } = await supabase
    .from("project_timeline_items")
    .select("stage_key")
    .eq("id", itemId)
    .maybeSingle();

  if (status === "completed") {
    const stageKey = item?.stage_key ?? null;
    if (stageKey) {
      const { data: reqs } = await supabase
        .from("project_document_requirements")
        .select("name, required, status")
        .eq("project_id", projectId)
        .eq("linked_stage_key", stageKey);
      const missing = (reqs ?? []).filter((r) => r.required && r.status === "missing");
      if (missing.length > 0) {
        return {
          ok: false,
          error: `Cannot complete — required document(s) missing: ${missing
            .map((m) => m.name)
            .join(", ")}. Upload them or mark Not Applicable with a reason.`,
        };
      }
    }
    if (stageKey === "legal_activity_screening") {
      const { count } = await supabase
        .from("project_listed_activities")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (!count) {
        return {
          ok: false,
          error: "Capture at least one listed activity before completing Legal Activity Screening.",
        };
      }
    }
  }

  const { error } = await supabase
    .from("project_timeline_items")
    .update({
      status: status as never,
      completed_date: status === "completed" ? isoOffset(0) : null,
    })
    .eq("id", itemId);
  if (error) return { ok: false, error: error.message };

  invalidateProject(projectId);
  return { ok: true };
}

const stageDetailsSchema = z.object({
  assigned_to: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : null)),
  due_date: optionalDate,
  completion_requirements: optionalText,
  internal_notes: optionalText,
});

export async function updateStageDetails(
  projectId: string,
  itemId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireEditor();
  if (!profile) return { error: "You do not have permission to edit this project." };

  const parsed = stageDetailsSchema.safeParse({
    assigned_to: formData.get("assigned_to") ?? "",
    due_date: formData.get("due_date") ?? "",
    completion_requirements: formData.get("completion_requirements") ?? "",
    internal_notes: formData.get("internal_notes") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"] };
  }

  const { error } = await supabase
    .from("project_timeline_items")
    .update({
      ...parsed.data,
      risk_flag: formData.get("risk_flag") === "on",
    })
    .eq("id", itemId);
  if (error) return { error: error.message };

  invalidateProject(projectId);
  return { success: "Stage updated." };
}

// ---------------------------------------------------------------------------
// Listed activities
// ---------------------------------------------------------------------------
const activitySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : null)),
  activity_number: z.string().trim().min(1, "Activity number is required"),
  category: optionalText,
  description: optionalText,
  waste_stream: optionalText,
  threshold: optionalText,
  project_capacity: optionalText,
  triggered: z.enum(ACTIVITY_TRIGGERED_KEYS as [string, ...string[]]),
  notes: optionalText,
});

export async function upsertListedActivity(
  projectId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireEditor();
  if (!profile) return { error: "You do not have permission to edit this project." };

  const parsed = activitySchema.safeParse({
    id: formData.get("id") ?? "",
    activity_number: formData.get("activity_number"),
    category: formData.get("category") ?? "",
    description: formData.get("description") ?? "",
    waste_stream: formData.get("waste_stream") ?? "",
    threshold: formData.get("threshold") ?? "",
    project_capacity: formData.get("project_capacity") ?? "",
    triggered: formData.get("triggered"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"] };
  }
  const { id, ...values } = parsed.data;

  if (id) {
    const { error } = await supabase
      .from("project_listed_activities")
      .update({ ...values, triggered: values.triggered as never })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("project_listed_activities").insert({
      project_id: projectId,
      ...values,
      triggered: values.triggered as never,
    });
    if (error) return { error: error.message };
  }

  invalidateProject(projectId);
  return { success: id ? "Activity updated." : "Activity added." };
}

export async function deleteListedActivity(
  projectId: string,
  id: string
): Promise<ActionResult> {
  const profile = await requireEditor();
  if (!profile) return { ok: false, error: "Not permitted." };
  const { error } = await supabase.from("project_listed_activities").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  invalidateProject(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Document requirements
// ---------------------------------------------------------------------------
export async function setDocRequirementStatus(
  projectId: string,
  reqId: string,
  status: "missing" | "uploaded" | "approved" | "not_applicable",
  naReason?: string
): Promise<ActionResult> {
  const profile = await requireEditor();
  if (!profile) return { ok: false, error: "Not permitted." };
  if (!DOC_REQ_STATUS_KEYS.includes(status)) return { ok: false, error: "Invalid status." };
  if (status === "not_applicable" && !naReason?.trim()) {
    return { ok: false, error: "A reason is required to mark a document Not Applicable." };
  }

  const dated = status === "uploaded" || status === "approved";
  const { error } = await supabase
    .from("project_document_requirements")
    .update({
      status: status as never,
      na_reason: status === "not_applicable" ? naReason!.trim() : null,
      upload_date: dated ? isoOffset(0) : null,
    })
    .eq("id", reqId);
  if (error) return { ok: false, error: error.message };

  invalidateProject(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------
const deadlineSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")).transform((v) => (v ? v : null)),
  name: z.string().trim().min(1, "Name is required"),
  trigger_date: optionalDate,
  due_date: optionalDate,
  notes: optionalText,
});

export async function upsertDeadline(
  projectId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireEditor();
  if (!profile) return { error: "You do not have permission to edit this project." };

  const completed = formData.get("completed") === "on";
  const parsed = deadlineSchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    trigger_date: formData.get("trigger_date") ?? "",
    due_date: formData.get("due_date") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"] };
  }
  const { id, ...values } = parsed.data;
  const status = deadlineStatusFor(values.due_date, completed);

  if (id) {
    const { error } = await supabase
      .from("project_deadlines")
      .update({ ...values, status: status as never })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("project_deadlines").insert({
      project_id: projectId,
      ...values,
      status: status as never,
    });
    if (error) return { error: error.message };
  }

  invalidateProject(projectId);
  return { success: id ? "Deadline updated." : "Deadline added." };
}

export async function deleteDeadline(projectId: string, id: string): Promise<ActionResult> {
  const profile = await requireEditor();
  if (!profile) return { ok: false, error: "Not permitted." };
  const { error } = await supabase.from("project_deadlines").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  invalidateProject(projectId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Notes (reuse project_comments)
// ---------------------------------------------------------------------------
const noteSchema = z.object({
  body: z.string().trim().min(1, "Write a note first"),
  visibility: z.enum(["internal", "client"]),
});

export async function addProjectNote(
  projectId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireEditor();
  if (!profile) return { error: "You do not have permission to edit this project." };

  const parsed = noteSchema.safeParse({
    body: formData.get("body"),
    visibility: formData.get("visibility") ?? "internal",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as FormState["fieldErrors"] };
  }

  const { error } = await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: profile.id,
    body: parsed.data.body,
    visibility: parsed.data.visibility as never,
  });
  if (error) return { error: error.message };

  invalidateProject(projectId);
  return { success: "Note added." };
}

// ---------------------------------------------------------------------------
// Stage status + an attached comment (recorded as a project note)
// ---------------------------------------------------------------------------
const STATUS_VERB = {
  pending: "Reset",
  in_progress: "Started",
  completed: "Completed",
  skipped: "Skipped",
} as const;

export async function updateStageStatusWithComment(
  projectId: string,
  itemId: string,
  status: "pending" | "in_progress" | "completed" | "skipped",
  comment?: string
): Promise<ActionResult> {
  // Reuse the gated status change (required docs / listed-activity rules).
  const res = await setStageStatus(projectId, itemId, status);
  if (!res.ok) return res;

  const note = comment?.trim();
  if (note) {
    const profile = await getActionProfile();
    if (profile) {
      const { data: item } = await supabase
        .from("project_timeline_items")
        .select("stage_name")
        .eq("id", itemId)
        .maybeSingle();
      await supabase.from("project_comments").insert({
        project_id: projectId,
        author_id: profile.id,
        body: `${STATUS_VERB[status]} "${item?.stage_name ?? "stage"}" — ${note}`,
        visibility: "internal" as never,
      });
      invalidateProject(projectId);
    }
  }
  return { ok: true };
}
