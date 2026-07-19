import { Link, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format, isBefore, startOfDay } from "date-fns";
import { CheckSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PriorityBadge, TaskStatusBadge } from "@/components/status-badge";
import { TaskDialog } from "./task-dialog";
import { TasksFilters } from "./tasks-filters";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/lib/database.types";

type TaskRowData = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  project: { id: string; name: string } | null;
  assignee: { full_name: string } | null;
};

export default function TasksPage() {
  useDocumentTitle("Tasks");
  const { data: profile } = useProfile();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const mine = searchParams.get("mine") ?? undefined;

  const tasksQuery = useQuery({
    queryKey: ["tasks", { q, status, priority, mine }],
    enabled: !!profile,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(
          // tasks has two FKs to profiles (assigned_to, created_by) — name the one to embed.
          "id, title, status, priority, due_date, project:projects(id, name), assignee:profiles!tasks_assigned_to_fkey(full_name)"
        )
        .order("due_date", { ascending: true, nullsFirst: false });

      if (q) query = query.ilike("title", `%${q}%`);
      if (status) query = query.eq("status", status as never);
      if (priority) query = query.eq("priority", priority as never);
      if (mine === "1") query = query.eq("assigned_to", profile!.id);

      const { data, error } = await query;
      if (error) throw new Error(`Failed to load tasks: ${error.message}`);
      return (data ?? []) as unknown as TaskRowData[];
    },
  });

  // Dropdown lists for the dialog — shared ["staff"] key so user-management
  // actions can invalidate them.
  const listsQuery = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [{ data: projects }, { data: staff }] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name")
          .not("status", "in", "(completed,cancelled)")
          .order("name"),
        supabase
          .from("profiles")
          .select("id, full_name")
          .in("role", ["admin", "staff"])
          .eq("active", true)
          .order("full_name"),
      ]);
      return { projects: projects ?? [], staff: staff ?? [] };
    },
  });

  if (tasksQuery.error) throw tasksQuery.error;
  if (!tasksQuery.data || !listsQuery.data || !profile) return null;

  const tasks = tasksQuery.data;
  const { projects, staff } = listsQuery.data;
  const today = startOfDay(new Date());
  const hasFilters = Array.from(searchParams.keys()).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="All tasks across projects.">
        <TaskDialog
          projects={projects.map((p) => ({ id: p.id, label: p.name }))}
          staff={staff.map((s) => ({ id: s.id, label: s.full_name }))}
          defaultAssigneeId={profile.id}
        />
      </PageHeader>

      <TasksFilters />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={hasFilters ? "No tasks match these filters" : "No tasks yet"}
          description={
            hasFilters
              ? "Try adjusting or clearing the filters."
              : projects.length === 0
                ? "Create a project first — tasks always belong to a project."
                : "Create your first task to start tracking work."
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
                <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => {
                const overdue =
                  t.due_date &&
                  t.status !== "done" &&
                  isBefore(new Date(t.due_date), today);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-72">
                      <span className="block truncate font-medium">{t.title}</span>
                    </TableCell>
                    <TableCell className="hidden max-w-56 md:table-cell">
                      {t.project ? (
                        <Link
                          to={`/projects/${t.project.id}`}
                          className="block truncate text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {t.project.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {t.assignee?.full_name ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={t.priority} />
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={t.status} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "hidden sm:table-cell",
                        overdue
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {t.due_date ? format(new Date(t.due_date), "d MMM yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
