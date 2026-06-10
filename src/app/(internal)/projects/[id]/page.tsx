import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDot,
  Eye,
  EyeOff,
  MinusCircle,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  PriorityBadge,
  ProjectStatusBadge,
  TimelineStatusBadge,
} from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type {
  ProjectRow,
  ProjectTimelineItemRow,
  TimelineStatus,
} from "@/lib/database.types";

type ProjectDetail = ProjectRow & {
  client: { id: string; company_name: string } | null;
  manager: { id: string; full_name: string } | null;
};

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

function TimelineIcon({ status }: { status: TimelineStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-5 text-primary" />;
    case "in_progress":
      return <CircleDot className="size-5 text-emerald-500" />;
    case "skipped":
      return <MinusCircle className="size-5 text-muted-foreground/50" />;
    default:
      return <Circle className="size-5 text-muted-foreground/40" />;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireInternal();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: projectData, error }, { data: itemsData }] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          "*, client:clients(id, company_name), manager:profiles!projects_manager_id_fkey(id, full_name)"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("project_timeline_items")
        .select("*")
        .eq("project_id", id)
        .order("sort_order"),
    ]);

  if (error) throw new Error(`Failed to load project: ${error.message}`);
  if (!projectData) notFound();

  const project = projectData as unknown as ProjectDetail;
  const items = (itemsData ?? []) as ProjectTimelineItemRow[];

  const currentStage = items.find(
    (i) => i.status !== "completed" && i.status !== "skipped"
  );
  const nextStage = currentStage
    ? items.find(
        (i) =>
          i.sort_order > currentStage.sort_order &&
          i.status !== "completed" &&
          i.status !== "skipped"
      )
    : undefined;

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
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium tabular-nums">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2.5" />
              </div>
              <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">
                    {project.client?.company_name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Manager:</span>
                  <span className="font-medium">
                    {project.manager?.full_name ?? "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">
                    {fmtDate(project.start_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">
                    {fmtDate(project.target_date)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Current stage</p>
                  <p className="font-medium">
                    {currentStage?.stage_name ?? "All stages completed"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next step</p>
                  <p className="font-medium">{nextStage?.stage_name ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline (read-only in Phase 1; full editing ships in Phase 2) */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>
                Generated from the {PROJECT_TYPE_LABELS[project.project_type]}{" "}
                template. Stages marked with an eye are visible to the client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No timeline stages yet.
                </p>
              ) : (
                <ol className="relative space-y-0">
                  {items.map((item, idx) => (
                    <li key={item.id} className="relative flex gap-3 pb-6">
                      {idx < items.length - 1 && (
                        <span
                          className="absolute top-6 left-[9px] h-full w-px bg-border"
                          aria-hidden
                        />
                      )}
                      <div className="relative z-10 bg-card">
                        <TimelineIcon status={item.status} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              item.status === "skipped" &&
                                "text-muted-foreground line-through"
                            )}
                          >
                            {item.stage_name}
                          </p>
                          <TimelineStatusBadge status={item.status} />
                          {item.client_visible ? (
                            <Eye
                              className="size-3.5 text-muted-foreground"
                              aria-label="Visible to client"
                            />
                          ) : (
                            <EyeOff
                              className="size-3.5 text-muted-foreground/40"
                              aria-label="Internal only"
                            />
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.status === "completed"
                            ? `Completed ${fmtDate(item.completed_date)}`
                            : item.due_date
                              ? `Due ${fmtDate(item.due_date)}`
                              : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {project.client_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client summary</CardTitle>
                <CardDescription>Shown in the client portal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{project.client_summary}</p>
              </CardContent>
            </Card>
          )}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Internal description
                </CardTitle>
                <CardDescription>Never shown to the client</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
