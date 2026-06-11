import { createClient } from "@/lib/supabase/server";
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
import { WmlOverview } from "./wml-overview";
import { WmlTimeline } from "./wml-timeline";
import { WmlDocuments } from "./wml-documents";
import { WmlListedActivities } from "./wml-listed-activities";
import { WmlDeadlines } from "./wml-deadlines";
import { WmlNotes } from "./wml-notes";

export type WmlProject = ProjectRow & {
  client: { id: string; company_name: string } | null;
  manager: { id: string; full_name: string } | null;
};

type CommentWithAuthor = ProjectCommentRow & {
  author: { full_name: string } | null;
};

export async function WmlProjectDetail({ project }: { project: WmlProject }) {
  const supabase = await createClient();
  const projectId = project.id;

  const [items, activities, docReqs, deadlines, comments, staff] = await Promise.all([
    supabase
      .from("project_timeline_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .then((r) => (r.data ?? []) as ProjectTimelineItemRow[]),
    supabase
      .from("project_listed_activities")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .then((r) => (r.data ?? []) as ProjectListedActivityRow[]),
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
  ]);

  const suggested = computeRisk(project.status, deadlines, docReqs);
  const riskLevel: RiskLevel = project.risk_level ?? suggested.level;
  const riskReason = project.risk_reason ?? suggested.reason;

  return (
    <div className="space-y-6">
      <WmlOverview
        project={project}
        riskLevel={riskLevel}
        riskReason={riskReason}
        riskIsManual={project.risk_level !== null}
      />
      <WmlTimeline projectId={projectId} items={items} docReqs={docReqs} staff={staff} />
      <WmlDocuments projectId={projectId} route={project.route} docReqs={docReqs} />
      <WmlListedActivities projectId={projectId} activities={activities} />
      <WmlDeadlines projectId={projectId} deadlines={deadlines} />
      <WmlNotes projectId={projectId} comments={comments} />
    </div>
  );
}
