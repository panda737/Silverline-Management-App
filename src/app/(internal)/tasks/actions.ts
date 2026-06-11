"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { PRIORITIES } from "@/lib/labels";

const TASK_STATUSES = ["todo", "in_progress", "waiting", "review", "done"] as const;

const taskSchema = z.object({
  title: z.string().trim().min(2, "Enter a task title"),
  project_id: z.string().uuid("Select a project"),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  assigned_to: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  priority: z.enum(PRIORITIES as [string, ...string[]]),
  status: z.enum(TASK_STATUSES),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});

export type TaskFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"title" | "project_id" | "due_date", string[]>>;
};

export async function createTask(
  _prev: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  // Internal users only — re-checked server-side.
  const profile = await getProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return { error: "You do not have permission to create tasks." };
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    project_id: formData.get("project_id"),
    description: formData.get("description") ?? "",
    assigned_to: formData.get("assigned_to") ?? "",
    priority: formData.get("priority"),
    status: formData.get("status"),
    due_date: formData.get("due_date") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as TaskFormState["fieldErrors"],
    };
  }
  const input = parsed.data;

  const supabase = await createClient();

  // Tasks are internal-only — reject assignment to client or deactivated profiles.
  if (input.assigned_to) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id, role, active")
      .eq("id", input.assigned_to)
      .maybeSingle();
    if (!assignee || assignee.role === "client" || !assignee.active) {
      return { error: "Tasks can only be assigned to active internal users." };
    }
  }

  const { error } = await supabase.from("tasks").insert({
    title: input.title,
    project_id: input.project_id,
    description: input.description,
    assigned_to: input.assigned_to,
    priority: input.priority as never,
    status: input.status as never,
    due_date: input.due_date,
    created_by: profile.id,
  });
  if (error) {
    return { error: `Could not create task: ${error.message}` };
  }

  await supabase.from("activity_log").insert({
    project_id: input.project_id,
    actor_id: profile.id,
    action: "task_created",
    details: { title: input.title },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: "Task created." };
}

const statusSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(TASK_STATUSES),
});

export async function setTaskStatus(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    throw new Error("Not allowed");
  }

  const parsed = statusSchema.safeParse({
    task_id: formData.get("task_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid request");

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: parsed.data.status as never,
      completed_date:
        parsed.data.status === "done"
          ? new Date().toISOString().slice(0, 10)
          : null,
    })
    .eq("id", parsed.data.task_id);
  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
