import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FolderKanban,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { ProjectsFilters } from "./projects-filters";
import { ProjectStats } from "./project-stats";
import { ProjectsTable } from "./projects-table";
import {
  SORT_KEYS,
  sortProjects,
  summarise,
  toCsv,
  type ProjectListRow,
  type SortDir,
  type SortKey,
} from "./project-row";

const FILTER_KEYS = ["q", "type", "status", "priority", "manager", "client"] as const;

type FilterParams = Partial<Record<(typeof FILTER_KEYS)[number], string>>;

const PAGE_SIZES = [10, 25, 50];

const PROJECT_SELECT =
  "id, name, project_type, status, priority, progress, target_date, next_action, " +
  "client:clients(company_name), " +
  "manager:profiles!projects_manager_id_fkey(full_name), " +
  "timeline:project_timeline_items(stage_name, status, due_date, completed_date, sort_order)";

function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

function ProjectCards({ projects }: { projects: ProjectListRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <Link
          key={p.id}
          to={`/projects/${p.id}`}
          className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Card className="h-full gap-3 transition hover:ring-foreground/25">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2 min-w-0 flex-1 text-sm group-hover:text-primary">
                  {p.name}
                </CardTitle>
                <span className="shrink-0">
                  <ProjectStatusBadge status={p.status} />
                </span>
              </div>
              <CardDescription className="truncate text-xs">
                {p.client?.company_name ?? "No client"} ·{" "}
                {PROJECT_TYPE_LABELS[p.project_type]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Manager</dt>
                  <dd className="truncate font-medium">
                    {p.manager?.full_name ?? "—"}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Target</dt>
                  <dd className="font-medium">
                    {p.target_date
                      ? format(new Date(p.target_date), "d MMM yyyy")
                      : "—"}
                  </dd>
                </div>
              </dl>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium tabular-nums">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-1.5" />
              </div>
              <PriorityBadge priority={p.priority} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  useDocumentTitle("Projects");
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => startOfDay(new Date()), []);

  const params: FilterParams = {};
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value !== null) params[key] = value;
  }

  const view = searchParams.get("view") === "cards" ? "cards" : "table";
  const rawSort = searchParams.get("sort");
  const sortKey: SortKey = (SORT_KEYS as readonly string[]).includes(
    rawSort ?? ""
  )
    ? (rawSort as SortKey)
    : "name";
  const sortDir: SortDir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const perPage = PAGE_SIZES.includes(Number(searchParams.get("per")))
    ? Number(searchParams.get("per"))
    : 10;

  function setParam(next: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) p.delete(key);
      else p.set(key, value);
    }
    setSearchParams(p, { replace: true });
  }

  function handleSort(key: SortKey) {
    const dir: SortDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setParam({ sort: key, dir, page: null });
  }

  const projectsQuery = useQuery({
    queryKey: ["projects", params],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select(PROJECT_SELECT)
        .order("created_at", { ascending: false });

      if (params.q) query = query.ilike("name", `%${params.q}%`);
      if (params.type) query = query.eq("project_type", params.type as never);
      if (params.status) query = query.eq("status", params.status as never);
      if (params.priority) query = query.eq("priority", params.priority as never);
      if (params.manager) query = query.eq("manager_id", params.manager);
      if (params.client) query = query.eq("client_id", params.client);

      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to load projects: ${error.message}`);
      }
      return data;
    },
  });

  // Stat cards summarise the whole portfolio, so they ignore the filter bar.
  const statsQuery = useQuery({
    queryKey: ["projects", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, status, target_date");
      if (error) {
        throw new Error(`Failed to load project stats: ${error.message}`);
      }
      return data;
    },
  });

  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["admin", "staff"])
        .eq("active", true)
        .order("full_name");
      return data;
    },
  });

  const clientsQuery = useQuery({
    queryKey: ["clients", "list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      return data;
    },
  });

  if (projectsQuery.isError) {
    throw projectsQuery.error;
  }

  if (
    projectsQuery.isPending ||
    statsQuery.isPending ||
    staffQuery.isPending ||
    clientsQuery.isPending
  ) {
    return <ProjectsLoading />;
  }

  const staff = staffQuery.data;
  const clients = clientsQuery.data;
  const projects = (projectsQuery.data ?? []) as unknown as ProjectListRow[];

  const stats = summarise(statsQuery.data ?? [], today);

  const sorted = sortProjects(projects, sortKey, sortDir);
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const page = Math.min(
    Math.max(1, Number(searchParams.get("page")) || 1),
    pageCount
  );
  const start = (page - 1) * perPage;
  const visible = sorted.slice(start, start + perPage);

  function exportCsv() {
    const blob = new Blob([toCsv(sorted, today)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `silverline-projects-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const hasFilters = Object.keys(params).length > 0;

  return (
    // Viewport-locked: header/stats/filters stay put, only the rows scroll.
    <div className="flex h-[calc(100svh-6rem)] min-h-[32rem] flex-col gap-4">
      <PageHeader
        className="shrink-0"
        title="Projects"
        description="Track all compliance projects and stay on top of what's next."
      >
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={exportCsv}
          disabled={sorted.length === 0}
        >
          <Download className="size-3.5" />
          Export
        </Button>
        <Select
          value={view}
          onValueChange={(v) => setParam({ view: v === "table" ? null : v })}
        >
          <SelectTrigger className="h-9 w-[130px] text-[13px]">
            <span className="mr-1 text-muted-foreground">View</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Table</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild size="sm" className="h-9">
          <Link to="/projects/new">
            <Plus className="size-3.5" />
            New project
          </Link>
        </Button>
      </PageHeader>

      <div className="shrink-0">
        <ProjectStats {...stats} />
      </div>

      <div className="shrink-0">
        <ProjectsFilters
          managers={(staff ?? []).map((s) => ({ id: s.id, label: s.full_name }))}
          clients={(clients ?? []).map((c) => ({
            id: c.id,
            label: c.company_name,
          }))}
        />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={
            hasFilters ? "No projects match these filters" : "No projects yet"
          }
          description={
            hasFilters
              ? "Try adjusting or clearing the filters."
              : "Create your first project to start tracking timelines, tasks and client updates."
          }
        >
          {!hasFilters && (
            <Button asChild size="sm">
              <Link to="/projects/new">
                <Plus className="size-3.5" />
                Create project
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {view === "table" ? (
            <ProjectsTable
              projects={visible}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              today={today}
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <ProjectCards projects={visible} />
            </div>
          )}

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Showing {start + 1} to {start + visible.length} of {sorted.length}{" "}
              project{sorted.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(perPage)}
                onValueChange={(v) => setParam({ per: v, page: null })}
              >
                <SelectTrigger className="h-8 w-[130px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="First page"
                  disabled={page === 1}
                  onClick={() => setParam({ page: null })}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setParam({ page: String(page - 1) })}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    variant={n === page ? "default" : "outline"}
                    size="icon"
                    className={cn("size-8 text-[13px] tabular-nums")}
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => setParam({ page: n === 1 ? null : String(n) })}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Next page"
                  disabled={page === pageCount}
                  onClick={() => setParam({ page: String(page + 1) })}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Last page"
                  disabled={page === pageCount}
                  onClick={() => setParam({ page: String(pageCount) })}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
