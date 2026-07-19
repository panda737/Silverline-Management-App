import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { ProjectDetail, type ProjectWithRelations } from "./project-detail";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data: projectData, error } = await supabase
        .from("projects")
        .select(
          "*, client:clients(id, company_name), manager:profiles!projects_manager_id_fkey(id, full_name)"
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw new Error(`Failed to load project: ${error.message}`);
      return (projectData as unknown as ProjectWithRelations | null) ?? null;
    },
    enabled: !!id,
  });

  if (query.error) throw query.error;
  if (query.isPending) return null;

  const project = query.data;
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground">Project not found</p>
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/projects">
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
