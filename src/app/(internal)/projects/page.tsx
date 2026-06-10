import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { ProjectsFilters } from "./projects-filters";
import type {
  Priority,
  ProjectStatus,
  ProjectType,
} from "@/lib/database.types";

export const metadata: Metadata = { title: "Projects" };

type ProjectListRow = {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  target_date: string | null;
  client: { company_name: string } | null;
  manager: { full_name: string } | null;
};

type SearchParams = Promise<{
  q?: string;
  type?: string;
  status?: string;
  priority?: string;
  manager?: string;
  client?: string;
}>;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireInternal();
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select(
      "id, name, project_type, status, priority, progress, target_date, client:clients(company_name), manager:profiles!projects_manager_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.type) query = query.eq("project_type", params.type as never);
  if (params.status) query = query.eq("status", params.status as never);
  if (params.priority) query = query.eq("priority", params.priority as never);
  if (params.manager) query = query.eq("manager_id", params.manager);
  if (params.client) query = query.eq("client_id", params.client);

  const [{ data, error }, { data: staff }, { data: clients }] =
    await Promise.all([
      query,
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["admin", "staff"])
        .eq("active", true)
        .order("full_name"),
      supabase.from("clients").select("id, company_name").order("company_name"),
    ]);

  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`);
  }
  const projects = (data ?? []) as unknown as ProjectListRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="All active and historical compliance projects."
      >
        <Button asChild size="sm">
          <Link href="/projects/new">
            <Plus className="size-3.5" />
            New project
          </Link>
        </Button>
      </PageHeader>

      <ProjectsFilters
        managers={(staff ?? []).map((s) => ({ id: s.id, label: s.full_name }))}
        clients={(clients ?? []).map((c) => ({
          id: c.id,
          label: c.company_name,
        }))}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={
            Object.keys(params).length > 0
              ? "No projects match these filters"
              : "No projects yet"
          }
          description={
            Object.keys(params).length > 0
              ? "Try adjusting or clearing the filters."
              : "Create your first project to start tracking timelines, tasks and client updates."
          }
        >
          {Object.keys(params).length === 0 && (
            <Button asChild size="sm">
              <Link href="/projects/new">
                <Plus className="size-3.5" />
                Create project
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Card className="h-full gap-3 transition hover:ring-foreground/25">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate text-sm group-hover:text-primary">
                      {p.name}
                    </CardTitle>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <CardDescription className="truncate text-xs">
                    {p.client?.company_name ?? "No client"} ·{" "}
                    {PROJECT_TYPE_LABELS[p.project_type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <dt className="text-muted-foreground">Manager</dt>
                      <dd className="truncate font-medium">
                        {p.manager?.full_name ?? "—"}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-muted-foreground">Target</dt>
                      <dd className="font-medium">
                        {p.target_date
                          ? format(new Date(p.target_date), "d MMM yyyy")
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium tabular-nums">
                        {p.progress}%
                      </span>
                    </div>
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                  <PriorityBadge priority={p.priority} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
