import type { Metadata } from "next";
import Link from "next/link";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckSquare,
  Clock,
  FolderKanban,
  Hourglass,
  Landmark,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge, TaskStatusBadge } from "@/components/status-badge";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/labels";
import type {
  Priority,
  ProjectStatus,
  ProjectType,
  TaskStatus,
} from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

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

type DeadlineItem = {
  id: string;
  label: string;
  due_date: string;
  projectId: string;
  projectName: string;
  kind: "task" | "stage";
};

type ActivityItem = {
  id: string;
  action: string;
  created_at: string;
  details: Record<string, unknown>;
  actor: { full_name: string } | null;
  project: { id: string; name: string } | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  project_created: "created project",
  status_changed: "changed status on",
  timeline_item_completed: "completed a stage on",
  timeline_item_updated: "updated the timeline of",
  task_completed: "completed a task on",
  document_uploaded: "uploaded a document to",
  client_update_posted: "posted a client update on",
  member_assigned: "assigned a member to",
  deadline_changed: "changed a deadline on",
};

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  accent?: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center gap-4 pt-6">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent ?? "bg-primary/10 text-primary"}`}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const profile = await requireInternal();
  const supabase = await createClient();

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const horizonStr = format(addDays(today, 14), "yyyy-MM-dd");

  const [
    { data: projectsData },
    { data: openTasksData },
    { data: myTasksData },
    { data: dueStagesData },
    { data: activityData },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, status, project_type"),
    supabase
      .from("tasks")
      .select(
        "id, title, due_date, status, priority, project:projects(id, name)"
      )
      .neq("status", "done")
      .not("due_date", "is", null)
      .lte("due_date", horizonStr)
      .order("due_date"),
    supabase
      .from("tasks")
      .select(
        "id, title, due_date, status, priority, project:projects(id, name)"
      )
      .eq("assigned_to", profile.id)
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
      .select(
        "id, action, created_at, details, actor:profiles(full_name), project:projects(id, name)"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const projects = (projectsData ?? []) as ProjectLite[];
  const nearTasks = (openTasksData ?? []) as unknown as TaskLite[];
  const myTasks = (myTasksData ?? []) as unknown as TaskLite[];
  const activity = (activityData ?? []) as unknown as ActivityItem[];

  const activeProjects = projects.filter(
    (p) => !["completed", "cancelled"].includes(p.status)
  );
  const waitingClient = projects.filter((p) => p.status === "waiting_on_client");
  const waitingAuthority = projects.filter(
    (p) => p.status === "waiting_on_authority"
  );
  const atRisk = projects.filter((p) => p.status === "at_risk");

  const overdueTasks = nearTasks.filter(
    (t) => t.due_date && isBefore(new Date(t.due_date), today)
  );

  const byStatus = new Map<ProjectStatus, number>();
  const byType = new Map<ProjectType, number>();
  for (const p of projects) {
    byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
    byType.set(p.project_type, (byType.get(p.project_type) ?? 0) + 1);
  }

  const deadlines: DeadlineItem[] = [
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {profile.full_name.split(" ")[0] || "there"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Active projects"
          value={activeProjects.length}
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard
          title="Overdue tasks"
          value={overdueTasks.length}
          icon={Clock}
          href="/projects"
          accent="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        />
        <StatCard
          title="Waiting on client"
          value={waitingClient.length}
          icon={Hourglass}
          href="/projects?status=waiting_on_client"
          accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        />
        <StatCard
          title="Waiting on authority"
          value={waitingAuthority.length}
          icon={Landmark}
          href="/projects?status=waiting_on_authority"
          accent="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
        />
        <StatCard
          title="At risk"
          value={atRisk.length}
          icon={AlertTriangle}
          href="/projects?status=at_risk"
          accent="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-primary" />
              Upcoming deadlines
            </CardTitle>
            <CardDescription>Tasks and stages due in the next 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Nothing due in the next two weeks.
              </p>
            ) : (
              <ul className="space-y-3">
                {deadlines.map((d) => (
                  <li key={`${d.kind}-${d.id}`} className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-16 shrink-0 justify-center tabular-nums"
                    >
                      {format(new Date(d.due_date), "d MMM")}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.label}</p>
                      <Link
                        href={`/projects/${d.projectId}`}
                        className="truncate text-xs text-muted-foreground hover:text-primary hover:underline"
                      >
                        {d.projectName}
                      </Link>
                    </div>
                    <Badge variant="secondary" className="ml-auto shrink-0">
                      {d.kind === "task" ? "Task" : "Stage"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* My tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="size-4 text-primary" />
              My tasks
            </CardTitle>
            <CardDescription>Open tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No open tasks assigned to you.
              </p>
            ) : (
              <ul className="space-y-3">
                {myTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
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

        {/* Projects by status / type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects by status</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...byStatus.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <li key={status}>
                      <Link
                        href={`/projects?status=${status}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        <span>{PROJECT_STATUS_LABELS[status]}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
            {byType.size > 0 && (
              <>
                <p className="mt-5 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  By type
                </p>
                <ul className="space-y-2">
                  {[...byType.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <li key={type}>
                        <Link
                          href={`/projects?type=${type}`}
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          <span>{PROJECT_TYPE_LABELS[type]}</span>
                          <span className="font-medium tabular-nums">{count}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No activity yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p>
                        <span className="font-medium">
                          {a.actor?.full_name ?? "Someone"}
                        </span>{" "}
                        {ACTIVITY_LABELS[a.action] ?? a.action}{" "}
                        {a.project && (
                          <Link
                            href={`/projects/${a.project.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {a.project.name}
                          </Link>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.created_at), "d MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
