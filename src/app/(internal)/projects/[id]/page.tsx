import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { ProjectDetail, type ProjectWithRelations } from "./project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInternal();
  const { id } = await params;
  const supabase = await createClient();

  const { data: projectData, error } = await supabase
    .from("projects")
    .select(
      "*, client:clients(id, company_name), manager:profiles!projects_manager_id_fkey(id, full_name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load project: ${error.message}`);
  if (!projectData) notFound();

  const project = projectData as unknown as ProjectWithRelations;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h1 className="text-xl font-medium tracking-tight">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              <span className="text-sm text-muted-foreground">
                {PROJECT_TYPE_LABELS[project.project_type]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProjectDetail project={project} />
    </div>
  );
}
