import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import {
  Activity,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge, TaskStatusBadge } from "@/components/status-badge";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/labels";
import type {
  Priority,
  ProjectStatus,
  ProjectType,
  TaskStatus,
} from "@/lib/database.types";

type ProjectLite = {
  id: string;
  name: string;
  status: ProjectStatus;
  project_type: ProjectType;
};

type TaskLite = {
  id: string;
  title: string;
  due_date: string | null;
  status: TaskStatus;
  priority: Priority;
  project: { id: string; name: string } | null;
};

type ActivityItem = {
  id: string;
  action: string;
  created_at: string;
  actor: { full_name: string } | null;
  project: { id: string; name: string } | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  project_created: "created project",
  status_changed: "changed status on",
  timeline_item_completed: "completed a stage on",
  timeline_item_updated: "updated the timeline of",
  task_created: "added a task to",
  task_completed: "completed a task on",
  document_uploaded: "uploaded a document to",
  client_update_posted: "posted a client update on",
  member_assigned: "assigned a member to",
  deadline_changed: "changed a deadline on",
  client_created: "added client",
};

function Stat({
  label,
  value,
  href,
  alert,
}: {
  label: string;
  value: number;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link to={href}>
      <Card className="gap-1 py-4 transition-colors hover:border-foreground/20">
        <CardContent className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={`text-2xl leading-none font-medium tabular-nums ${
              alert && value > 0 ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {value}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { data: profile } = useProfile();
  const profileId = profile?.id;

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const horizonStr = format(addDays(today, 14), "yyyy-MM-dd");

  const { data, isPending } = useQuery({
    queryKey: ["dashboard", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const [
        { data: projectsData },
        { data: nearTasksData },
        { data: myTasksData },
        { data: dueStagesData },
        { data: activityData },
      ] = await Promise.all([
        supabase.from("projects").select("id, name, status, project_type"),
        supabase
          .from("tasks")
          .select("id, title, due_date, status, priority, project:projects(id, name)")
          .neq("status", "done")
          .not("due_date", "is", null)
          .lte("due_date", horizonStr)
          .order("due_date"),
        supabase
          .from("tasks")
          .select("id, title, due_date, status, priority, project:projects(id, name)")
          .eq("assigned_to", profileId!)
          .neq("status", "done")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(6),
        supabase
          .from("project_timeline_items")
          .select("id, stage_name, due_date, status, project:projects(id, name)")
          .in("status", ["pending", "in_progress"])
          .gte("due_date", todayStr)
          .lte("due_date", horizonStr)
          .order("due_date"),
        supabase
          .from("activity_log")
          .select("id, action, created_at, actor:profiles(full_name), project:projects(id, name)")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      return { projectsData, nearTasksData, myTasksData, dueStagesData, activityData };
    },
  });

  if (isPending || !profile) {
    return <DashboardLoading />;
  }

  const projects = (data?.projectsData ?? []) as ProjectLite[];
  const nearTasks = (data?.nearTasksData ?? []) as unknown as TaskLite[];
  const myTasks = (data?.myTasksData ?? []) as unknown as TaskLite[];
  const activity = (data?.activityData ?? []) as unknown as ActivityItem[];
  const dueStagesData = data?.dueStagesData;

  const activeProjects = projects.filter(
    (p) => !["completed", "cancelled"].includes(p.status)
  );
  const overdueTasks = nearTasks.filter(
    (t) => t.due_date && isBefore(new Date(t.due_date), today)
  );
  const waitingClient = projects.filter((p) => p.status === "waiting_on_client");
  const waitingAuthority = projects.filter(
    (p) => p.status === "waiting_on_authority"
  );
  const atRisk = projects.filter((p) => p.status === "at_risk");

  const byStatus = new Map<ProjectStatus, number>();
  const byType = new Map<ProjectType, number>();
  for (const p of projects) {
    byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
    byType.set(p.project_type, (byType.get(p.project_type) ?? 0) + 1);
  }

  const deadlines = [
    ...nearTasks
      .filter((t) => t.due_date && !isBefore(new Date(t.due_date), today))
      .map((t) => ({
        id: t.id,
        label: t.title,
        due_date: t.due_date!,
        projectId: t.project?.id ?? "",
        projectName: t.project?.name ?? "",
        kind: "task" as const,
      })),
    ...((dueStagesData ?? []) as unknown as {
      id: string;
      stage_name: string;
      due_date: string;
      project: { id: string; name: string } | null;
    }[]).map((s) => ({
      id: s.id,
      label: s.stage_name,
      due_date: s.due_date,
      projectId: s.project?.id ?? "",
      projectName: s.project?.name ?? "",
      kind: "stage" as const,
    })),
  ]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.full_name.split(" ")[0] || "there"}.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Active projects" value={activeProjects.length} href="/projects" />
        <Stat label="Overdue tasks" value={overdueTasks.length} href="/tasks" alert />
        <Stat
          label="Waiting on client"
          value={waitingClient.length}
          href="/projects?status=waiting_on_client"
        />
        <Stat
          label="Waiting on authority"
          value={waitingAuthority.length}
          href="/projects?status=waiting_on_authority"
        />
        <Stat label="At risk" value={atRisk.length} href="/projects?status=at_risk" alert />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking timelines, tasks and client updates."
        >
          <Button asChild size="sm">
            <Link to="/projects/new">
              <Plus className="size-3.5" />
              Create project
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarClock className="size-4 text-primary" />
                Upcoming deadlines
              </CardTitle>
              <CardDescription className="text-xs">
                Tasks and stages due in the next 14 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Nothing due in the next two weeks.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {deadlines.map((d) => (
                    <li key={`${d.kind}-${d.id}`} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {format(new Date(d.due_date), "d MMM")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{d.label}</p>
                        <Link
                          to={`/projects/${d.projectId}`}
                          className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {d.projectName}
                        </Link>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full border px-2 text-[11px] leading-[18px] text-muted-foreground">
                        {d.kind === "task" ? "Task" : "Stage"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="size-4 text-primary" />
                My tasks
              </CardTitle>
              <CardDescription className="text-xs">
                Open tasks assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myTasks.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No tasks assigned to you.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {myTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{t.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.project?.name}
                          {t.due_date &&
                            ` · due ${format(new Date(t.due_date), "d MMM")}`}
                        </p>
                      </div>
                      <PriorityBadge priority={t.priority} />
                      <TaskStatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projects by status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-0.5">
                {[...byStatus.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <li key={status}>
                      <Link
                        to={`/projects?status=${status}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                      >
                        <span className="text-muted-foreground">
                          {PROJECT_STATUS_LABELS[status]}
                        </span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
              {byType.size > 0 && (
                <>
                  <p className="mt-4 mb-1 px-2 text-xs font-medium text-muted-foreground">
                    By type
                  </p>
                  <ul className="space-y-0.5">
                    {[...byType.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <li key={type}>
                          <Link
                            to={`/projects?type=${type}`}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                          >
                            <span className="text-muted-foreground">
                              {PROJECT_TYPE_LABELS[type]}
                            </span>
                            <span className="font-medium tabular-nums">{count}</span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-primary" />
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-2.5 text-sm">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="leading-snug">
                          <span className="font-medium">
                            {a.actor?.full_name ?? "Someone"}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {ACTIVITY_LABELS[a.action] ?? a.action}
                          </span>{" "}
                          {a.project && (
                            <Link
                              to={`/projects/${a.project.id}`}
                              className="hover:underline"
                            >
                              {a.project.name}
                            </Link>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "d MMM, HH:mm")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
