import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            All active and historical compliance projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="size-4" />
            New project
          </Link>
        </Button>
      </div>

      <ProjectsFilters
        managers={(staff ?? []).map((s) => ({ id: s.id, label: s.full_name }))}
        clients={(clients ?? []).map((c) => ({
          id: c.id,
          label: c.company_name,
        }))}
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No projects found</p>
            <p className="text-sm text-muted-foreground">
              {Object.keys(params).length > 0
                ? "Try adjusting the filters."
                : "Create your first project to get started."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/projects/new">
              <Plus className="size-4" />
              New project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <TableHead className="hidden lg:table-cell">Manager</TableHead>
                <TableHead className="w-36">Progress</TableHead>
                <TableHead className="hidden xl:table-cell">Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-72 font-medium">
                    <Link
                      href={`/projects/${p.id}`}
                      className="block truncate hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {p.client?.company_name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {PROJECT_TYPE_LABELS[p.project_type]}
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PriorityBadge priority={p.priority} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {p.manager?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {p.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {p.target_date
                      ? format(new Date(p.target_date), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
