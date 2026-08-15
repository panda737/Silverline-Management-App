/**
 * The client's view of a project — the ONE definition of it.
 *
 * Rendered in two places, deliberately by the same component:
 *
 *   1. the client portal route, /portal/projects/:id
 *   2. the staff "Client View" tab on the internal project page
 *
 * It used to be two. The staff tab was a hand-written imitation, and on
 * 15 August 2026 the two had drifted far enough that the preview was showing a
 * completion percentage the client portal no longer had, and rendering the
 * summary, manager and updates as separate blocks the client portal had just
 * stopped rendering. It showed less than the client actually gets, so it was
 * not a leak — but a staff member opening it to check what the client sees was
 * getting a wrong answer, which is worse than having no preview at all.
 *
 * Both callers read the same portal_* views, so the preview cannot drift from
 * the real thing again without the real thing changing too.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectTimeline } from "@/components/project-timeline";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/labels";
import { PortalMission } from "./mission";
import type {
  PortalDocumentRow,
  PortalProjectRow,
  PortalTimelineItemRow,
  PortalUpdateRow,
} from "@/lib/database.types";

export function ClientProjectViewLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted/50" />
      <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
      <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}

export function useClientProjectView(projectId: string | undefined) {
  return useQuery({
    queryKey: ["portal", "project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const [{ data: project }, { data: stages }, { data: updates }, { data: documents }] =
        await Promise.all([
          supabase.from("portal_projects").select("*").eq("id", projectId!).maybeSingle(),
          supabase
            .from("portal_timeline_items")
            .select("*")
            .eq("project_id", projectId!)
            .order("sort_order"),
          supabase
            .from("portal_updates")
            .select("*")
            .eq("project_id", projectId!)
            .order("created_at", { ascending: false }),
          supabase
            .from("portal_documents")
            .select("*")
            .eq("project_id", projectId!)
            .order("created_at", { ascending: false }),
        ]);
      return {
        project: (project ?? null) as PortalProjectRow | null,
        stages: (stages ?? []) as PortalTimelineItemRow[],
        updates: (updates ?? []) as PortalUpdateRow[],
        documents: (documents ?? []) as PortalDocumentRow[],
      };
    },
  });
}

export function ClientProjectView({
  data,
  /**
   * Staff preview. The layout and content are identical either way — this only
   * disables the controls, because a staff member must not be able to confirm
   * a fact or upload a document as if they were the client. The client's own
   * RLS would refuse the write in any case; disabling it means they are not
   * invited to try.
   */
  readOnly = false,
  showHeader = true,
}: {
  data: NonNullable<ReturnType<typeof useClientProjectView>["data"]>;
  readOnly?: boolean;
  showHeader?: boolean;
}) {
  const { project, stages, updates, documents } = data;
  if (!project) return null;

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight">{project.name}</h1>
            <Badge variant="secondary" className="shrink-0">
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {PROJECT_TYPE_LABELS[project.project_type]}
          </p>
        </div>
      )}

      {stages.length > 0 ? (
        <ProjectTimeline items={stages} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No client-visible stages yet — the client will not see a timeline
            until a stage is marked client-visible.
          </CardContent>
        </Card>
      )}

      <PortalMission
        projectId={project.id}
        projectName={project.name}
        summary={project.client_summary}
        documents={documents}
        updates={updates}
        readOnly={readOnly}
      />
    </div>
  );
}
