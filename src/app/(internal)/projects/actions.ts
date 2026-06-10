"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { PRIORITIES, PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/labels";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const createProjectSchema = z.object({
  name: z.string().trim().min(3, "Project name must be at least 3 characters"),
  client_id: z.string().uuid("Select a client"),
  project_type: z.enum(PROJECT_TYPES as [string, ...string[]]),
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]),
  priority: z.enum(PRIORITIES as [string, ...string[]]),
  manager_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  start_date: optionalDate,
  target_date: optionalDate,
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  client_summary: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});

export type CreateProjectState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof createProjectSchema>, string[]>>;
};

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  // Re-check the caller's role server-side — never trust the client.
  const profile = await getProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return { error: "You do not have permission to create projects." };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    client_id: formData.get("client_id"),
    project_type: formData.get("project_type"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    manager_id: formData.get("manager_id") ?? "",
    start_date: formData.get("start_date") ?? "",
    target_date: formData.get("target_date") ?? "",
    description: formData.get("description") ?? "",
    client_summary: formData.get("client_summary") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as CreateProjectState["fieldErrors"],
    };
  }
  const input = parsed.data;

  const supabase = await createClient();

  // 1. Create the project (RLS: internal users only).
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      client_id: input.client_id,
      project_type: input.project_type as never,
      status: input.status as never,
      priority: input.priority as never,
      manager_id: input.manager_id,
      start_date: input.start_date,
      target_date: input.target_date,
      description: input.description,
      client_summary: input.client_summary,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (projectError || !project) {
    return { error: `Could not create project: ${projectError?.message}` };
  }

  // 2. Auto-generate the timeline from the template for this project type.
  const { data: template, error: templateError } = await supabase
    .from("timeline_templates")
    .select("stage_name, description, sort_order, default_client_visible")
    .eq("project_type", input.project_type as never)
    .order("sort_order");
  if (templateError) {
    return { error: `Project created but template fetch failed: ${templateError.message}` };
  }

  if (template && template.length > 0) {
    const items = template.map((stage) => ({
      project_id: project.id,
      stage_name: stage.stage_name,
      description: stage.description,
      sort_order: stage.sort_order,
      client_visible: stage.default_client_visible,
    }));
    const { error: itemsError } = await supabase
      .from("project_timeline_items")
      .insert(items);
    if (itemsError) {
      return { error: `Project created but timeline generation failed: ${itemsError.message}` };
    }
  }

  // 3. Activity log entry.
  await supabase.from("activity_log").insert({
    project_id: project.id,
    actor_id: profile.id,
    action: "project_created",
    details: { name: input.name, project_type: input.project_type },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}
