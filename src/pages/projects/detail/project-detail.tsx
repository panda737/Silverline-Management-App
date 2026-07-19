import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { computeRisk } from "@/lib/wml";
import type {
  ProfileRow,
  ProjectCommentRow,
  ProjectDeadlineRow,
  ProjectDocumentRequirementRow,
  ProjectListedActivityRow,
  ProjectRow,
  ProjectTimelineItemRow,
  RiskLevel,
} from "@/lib/database.types";
import { ProjectTabs } from "./project-tabs";
import { GenericOverview } from "./generic-overview";
import { WmlOverview } from "./wml/wml-overview";
import { WmlTimeline } from "./wml/wml-timeline";
import { WmlDocuments } from "./wml/wml-documents";
import { WmlListedActivities } from "./wml/wml-listed-activities";
import { WmlDeadlines } from "./wml/wml-deadlines";
import { WmlNotes } from "./wml/wml-notes";

export type ProjectWithRelations = ProjectRow & {
  client: { id: string; company_name: string } | null;
  manager: { id: string; full_name: string } | null;
};

type CommentWithAuthor = ProjectCommentRow & {
  author: { full_name: string } | null;
};

/**
 * Unified project detail. Every project type renders the same five-tab skeleton
 * (Overview · Timeline · Documents · Deadlines · Activity); only the data inside
 * differs. WML-specific content (route, legal stages, NEMWA listed activities,
 * derived risk) appears only on the Overview tab of WML projects.
 */
export function ProjectDetail({ project }: { project: ProjectWithRelations }) {
  const projectId = project.id;
  const isWml = project.project_type === "waste_management_licence";

  const query = useQuery({
    queryKey: ["project", projectId, "detail"],
    queryFn: async () => {
      const [items, docReqs, deadlines, comments, staff, activities] = await Promise.all([
        supabase
          .from("project_timeline_items")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order")
          .then((r) => (r.data ?? []) as ProjectTimelineItemRow[]),
        supabase
          .from("project_document_requirements")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order")
          .then((r) => (r.data ?? []) as ProjectDocumentRequirementRow[]),
        supabase
          .from("project_deadlines")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date", { nullsFirst: false })
          .then((r) => (r.data ?? []) as ProjectDeadlineRow[]),
        supabase
          .from("project_comments")
          .select("*, author:profiles(full_name)")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .then((r) => (r.data ?? []) as unknown as CommentWithAuthor[]),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["admin", "staff"])
          .eq("active", true)
          .order("full_name")
          .then((r) => (r.data ?? []) as Pick<ProfileRow, "id" | "full_name">[]),
        isWml
          ? supabase
              .from("project_listed_activities")
              .select("*")
              .eq("project_id", projectId)
              .order("sort_order")
              .then((r) => (r.data ?? []) as ProjectListedActivityRow[])
          : Promise.resolve([] as ProjectListedActivityRow[]),
      ]);
      return { items, docReqs, deadlines, comments, staff, activities };
    },
  });

  if (query.error) throw query.error;
  if (!query.data) return null;
  const { items, docReqs, deadlines, comments, staff, activities } = query.data;

  let overview: ReactNode;
  if (isWml) {
    const suggested = computeRisk(project.status, deadlines, docReqs);
    const riskLevel: RiskLevel = project.risk_level ?? suggested.level;
    const riskReason = project.risk_reason ?? suggested.reason;
    overview = (
      <>
        <WmlOverview
          project={project}
          riskLevel={riskLevel}
          riskReason={riskReason}
          riskIsManual={project.risk_level !== null}
        />
        <Separator />
        <WmlListedActivities projectId={projectId} activities={activities} />
      </>
    );
  } else {
    overview = <GenericOverview project={project} items={items} />;
  }

  return (
    <ProjectTabs
      overview={overview}
      timeline={
        <WmlTimeline projectId={projectId} items={items} docReqs={docReqs} staff={staff} />
      }
      documents={
        <WmlDocuments projectId={projectId} route={project.route} docReqs={docReqs} />
      }
      deadlines={<WmlDeadlines projectId={projectId} deadlines={deadlines} />}
      activity={<WmlNotes projectId={projectId} comments={comments} />}
    />
  );
}
