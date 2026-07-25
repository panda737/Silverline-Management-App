import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  FolderOpen,
  Link2,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge, ProjectStatusBadge } from "@/components/status-badge";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TYPE_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { updateProjectStatus } from "./actions";
import type { ProjectStatus } from "@/lib/database.types";
import {
  isOverdue,
  nextMilestone,
  type MilestoneTone,
  type ProjectListRow,
  type SortDir,
  type SortKey,
} from "./project-row";

const MILESTONE_ICONS: Record<MilestoneTone, typeof Clock> = {
  done: CheckCircle2,
  due: CalendarDays,
  overdue: CalendarDays,
  neutral: Clock,
};

const MILESTONE_ICON_CLASSES: Record<MilestoneTone, string> = {
  done: "text-emerald-600 dark:text-emerald-400",
  due: "text-amber-600 dark:text-amber-400",
  overdue: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

const MILESTONE_TEXT_CLASSES: Record<MilestoneTone, string> = {
  done: "text-muted-foreground",
  due: "text-amber-600 dark:text-amber-400",
  overdue: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
          active && "text-foreground"
        )}
      >
        {label}
        <Icon
          className={cn("size-3", active ? "opacity-100" : "opacity-40")}
        />
      </button>
    </TableHead>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
      {initials || "?"}
    </span>
  );
}

/** Status badge that is itself the dropdown: one click open, one click set. */
function StatusPicker({ project }: { project: ProjectListRow }) {
  const [pending, setPending] = useState(false);

  async function change(next: ProjectStatus) {
    if (next === project.status) return;
    setPending(true);
    const result = await updateProjectStatus(project.id, next);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        `${project.name} → ${PROJECT_STATUS_LABELS[next]}`
      );
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={pending}>
        <button
          type="button"
          aria-label={`Change status for ${project.name} — currently ${PROJECT_STATUS_LABELS[project.status]}`}
          className="group -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
        >
          <ProjectStatusBadge status={project.status} />
          {pending ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Set status</DropdownMenuLabel>
        {PROJECT_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => void change(s)}>
            <Check
              className={cn(
                "size-3.5 shrink-0",
                s === project.status ? "opacity-100" : "opacity-0"
              )}
            />
            <ProjectStatusBadge status={s} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowActions({ project }: { project: ProjectListRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`Actions for ${project.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to={`/projects/${project.id}`}>
            <FolderOpen className="size-3.5" />
            Open project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/projects/${project.id}?tab=documents`}>
            <FolderOpen className="size-3.5" />
            Documents
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            const url = `${window.location.origin}/projects/${project.id}`;
            void navigator.clipboard
              .writeText(url)
              .then(() => toast.success("Project link copied"))
              .catch(() => toast.error("Could not copy the link"));
          }}
        >
          <Link2 className="size-3.5" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectsTable({
  projects,
  sortKey,
  sortDir,
  onSort,
  today,
}: {
  projects: ProjectListRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  today: Date;
}) {
  const headProps = { activeKey: sortKey, dir: sortDir, onSort };

  return (
    // Own scroll container so the page chrome stays put and only rows move.
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="hover:bg-transparent">
            <SortableHead label="Project" sortKey="name" {...headProps} />
            <SortableHead label="Manager" sortKey="manager" {...headProps} />
            {/* Redundant with the project subtitle — drop it when space is tight. */}
            <SortableHead
              label="Client"
              sortKey="client"
              className="hidden xl:table-cell"
              {...headProps}
            />
            <SortableHead label="Status" sortKey="status" {...headProps} />
            <SortableHead label="Progress" sortKey="progress" {...headProps} />
            <SortableHead label="Priority" sortKey="priority" {...headProps} />
            <TableHead>Next Milestone</TableHead>
            <SortableHead
              label="Due Date"
              sortKey="target_date"
              {...headProps}
            />
            <TableHead className="w-10 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => {
            const milestone = nextMilestone(p, today);
            const MilestoneIcon = milestone
              ? MILESTONE_ICONS[milestone.tone]
              : null;
            const overdue = isOverdue(p, today);

            return (
              <TableRow key={p.id}>
                <TableCell className="max-w-[18rem] whitespace-normal">
                  <Link
                    to={`/projects/${p.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.client?.company_name ?? "No client"} ·{" "}
                    {PROJECT_TYPE_LABELS[p.project_type]}
                  </p>
                </TableCell>
                <TableCell>
                  {p.manager ? (
                    <span className="flex items-center gap-2">
                      <Initials name={p.manager.full_name} />
                      <span className="text-[13px]">
                        {p.manager.full_name}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden max-w-[8rem] truncate text-[13px] xl:table-cell">
                  {p.client?.company_name ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusPicker project={p} />
                </TableCell>
                <TableCell className="w-32">
                  <div className="space-y-1">
                    <span className="text-[13px] font-medium tabular-nums">
                      {p.progress}%
                    </span>
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={p.priority} />
                </TableCell>
                <TableCell className="max-w-[13rem]">
                  {milestone && MilestoneIcon ? (
                    <span className="flex items-start gap-1.5">
                      <MilestoneIcon
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          MILESTONE_ICON_CLASSES[milestone.tone]
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px]">
                          {milestone.title}
                        </span>
                        <span
                          className={cn(
                            "block truncate text-xs",
                            MILESTONE_TEXT_CLASSES[milestone.tone]
                          )}
                        >
                          {milestone.detail}
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-[13px]",
                    overdue
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                  )}
                >
                  {p.target_date
                    ? format(new Date(p.target_date), "d MMM yyyy")
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <RowActions project={p} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </table>
      </div>
    </div>
  );
}
