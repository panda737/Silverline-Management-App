import { format } from "date-fns";
import { CalendarDays, Eye, MessageSquare, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import type {
  ProjectCommentRow,
  ProjectTimelineItemRow,
} from "@/lib/database.types";
import { ProjectTimeline } from "./stage-stepper";
import type { ProjectWithRelations } from "./project-detail";

type CommentWithAuthor = ProjectCommentRow & { author: { full_name: string } | null };

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

/**
 * Preview of exactly what the client sees for this project in their portal:
 * only client-visible timeline stages and client-visible updates, read-only.
 * Mirrors the portal card layout (src/pages/portal/index.tsx).
 */
export function CustomerView({
  project,
  items,
  comments,
}: {
  project: ProjectWithRelations;
  items: ProjectTimelineItemRow[];
  comments: CommentWithAuthor[];
}) {
  const clientItems = items.filter((i) => i.client_visible);
  const clientUpdates = comments.filter((c) => c.visibility === "client");
  const currentStage = clientItems.find(
    (s) => s.status !== "completed" && s.status !== "skipped"
  );
  const clientName = project.client?.company_name;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
        <Eye className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Preview of what {clientName ?? "the client"} sees in their portal — only
          client-visible stages and updates appear here.
        </span>
      </div>

      {clientItems.length > 0 ? (
        <ProjectTimeline items={clientItems} progress={project.progress} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No client-visible stages yet — the client won't see a timeline until a
          stage is marked client-visible.
        </p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{project.name}</CardTitle>
            <ProjectStatusBadge status={project.status} />
          </div>
          <CardDescription>{PROJECT_TYPE_LABELS[project.project_type]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStage && (
            <div className="rounded-lg bg-accent px-3 py-2.5">
              <p className="text-xs font-medium tracking-wide text-accent-foreground/70 uppercase">
                Current stage
              </p>
              <p className="text-sm font-medium text-accent-foreground">
                {currentStage.stage_name}
              </p>
            </div>
          )}
          {project.client_summary && (
            <p className="text-sm text-muted-foreground">{project.client_summary}</p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {project.manager?.full_name && (
              <span className="flex items-center gap-1.5">
                <UserRound className="size-3.5" />
                {project.manager.full_name}
              </span>
            )}
            {project.target_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Target: {fmtDate(project.target_date)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-primary" />
          Latest updates
        </h3>
        {clientUpdates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No client-visible updates yet. Post one as a “Client-visible” note in
            the Activity tab.
          </p>
        ) : (
          <Card>
            <CardContent className="divide-y pt-6">
              {clientUpdates.map((u) => (
                <div key={u.id} className="space-y-1 py-4 first:pt-0 last:pb-0">
                  <p className="text-sm whitespace-pre-wrap">{u.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.author?.full_name ?? "Silverline"} · {fmtDate(u.created_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
