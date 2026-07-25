import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/labels";
import type {
  Priority,
  ProjectStatus,
  ProjectType,
  TimelineStatus,
} from "@/lib/database.types";

export type TimelineLite = {
  stage_name: string;
  status: TimelineStatus;
  due_date: string | null;
  completed_date: string | null;
  sort_order: number;
};

export type ProjectListRow = {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  target_date: string | null;
  next_action: string | null;
  client: { company_name: string } | null;
  manager: { full_name: string } | null;
  timeline: TimelineLite[];
};

// --- Status buckets ---------------------------------------------------------
// Deliberately not exhaustive: not_started / at_risk / cancelled sit outside
// these three, so the cards never pretend to add up to the total.
const IN_PROGRESS: ProjectStatus[] = ["in_progress", "drafting", "submitted"];
const WAITING: ProjectStatus[] = [
  "waiting_on_client",
  "waiting_on_authority",
  "on_hold",
];
const DONE: ProjectStatus[] = ["completed", "approved"];
const TERMINAL: ProjectStatus[] = ["completed", "approved", "cancelled"];

/** The slice of a project the stat cards and overdue check actually need. */
export type ProjectStatusLite = {
  status: ProjectStatus;
  target_date: string | null;
};

/** Past its target date and not in a terminal state. Cuts across the buckets. */
export function isOverdue(p: ProjectStatusLite, today: Date): boolean {
  if (!p.target_date || TERMINAL.includes(p.status)) return false;
  return startOfDay(new Date(p.target_date)) < today;
}

export function summarise(projects: ProjectStatusLite[], today: Date) {
  return {
    total: projects.length,
    inProgress: projects.filter((p) => IN_PROGRESS.includes(p.status)).length,
    waiting: projects.filter((p) => WAITING.includes(p.status)).length,
    completed: projects.filter((p) => DONE.includes(p.status)).length,
    overdue: projects.filter((p) => isOverdue(p, today)).length,
  };
}

// --- Next milestone ---------------------------------------------------------
export type MilestoneTone = "done" | "due" | "overdue" | "neutral";

export type Milestone = {
  title: string;
  detail: string;
  tone: MilestoneTone;
};

function days(n: number) {
  return `${n} day${n === 1 ? "" : "s"}`;
}

/**
 * The next open timeline stage, or the last completed one when the timeline is
 * finished. Falls back to the project's free-text next_action when a project
 * has no timeline at all.
 */
export function nextMilestone(
  p: ProjectListRow,
  today: Date
): Milestone | null {
  // Defensive: a cached row from an older query shape can arrive without it.
  const items = (Array.isArray(p.timeline) ? [...p.timeline] : []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const open = items.filter(
    (i) => i.status !== "completed" && i.status !== "skipped"
  );

  if (open.length === 0) {
    const done = items.filter((i) => i.status === "completed");
    const last = done[done.length - 1];
    if (last) {
      return {
        title: last.stage_name,
        detail: last.completed_date
          ? `Completed on ${format(new Date(last.completed_date), "d MMM yyyy")}`
          : "Completed",
        tone: "done",
      };
    }
    return p.next_action
      ? { title: p.next_action, detail: "Next action", tone: "neutral" }
      : null;
  }

  const next = open[0];
  const due = next.due_date ?? p.target_date;

  if (due) {
    const delta = differenceInCalendarDays(startOfDay(new Date(due)), today);
    if (delta < 0) {
      return {
        title: next.stage_name,
        detail: `Overdue by ${days(Math.abs(delta))}`,
        tone: "overdue",
      };
    }
    if (delta === 0) {
      return { title: next.stage_name, detail: "Due today", tone: "due" };
    }
    if (delta <= 7) {
      return {
        title: next.stage_name,
        detail: `Due in ${days(delta)}`,
        tone: "due",
      };
    }
    return {
      title: next.stage_name,
      detail: `ETA: ${format(new Date(due), "d MMM yyyy")}`,
      tone: "neutral",
    };
  }

  if (next.status === "in_progress") {
    return { title: next.stage_name, detail: "In progress", tone: "neutral" };
  }
  if (p.status === "waiting_on_client") {
    return {
      title: next.stage_name,
      detail: "Awaiting client input",
      tone: "neutral",
    };
  }
  if (p.status === "waiting_on_authority") {
    return {
      title: next.stage_name,
      detail: "Awaiting authority",
      tone: "neutral",
    };
  }
  return { title: next.stage_name, detail: "Pending", tone: "neutral" };
}

// --- Sorting ----------------------------------------------------------------
export const SORT_KEYS = [
  "name",
  "client",
  "manager",
  "status",
  "progress",
  "priority",
  "target_date",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

const PRIORITY_RANK: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

function compare(a: ProjectListRow, b: ProjectListRow, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "client":
      return (a.client?.company_name ?? "").localeCompare(
        b.client?.company_name ?? ""
      );
    case "manager":
      return (a.manager?.full_name ?? "").localeCompare(
        b.manager?.full_name ?? ""
      );
    case "status":
      return PROJECT_STATUS_LABELS[a.status].localeCompare(
        PROJECT_STATUS_LABELS[b.status]
      );
    case "progress":
      return a.progress - b.progress;
    case "priority":
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "target_date": {
      // Undated projects always sort last, whichever direction is active.
      if (!a.target_date && !b.target_date) return 0;
      if (!a.target_date) return 1;
      if (!b.target_date) return -1;
      return a.target_date.localeCompare(b.target_date);
    }
  }
}

export function sortProjects(
  projects: ProjectListRow[],
  key: SortKey,
  dir: SortDir
): ProjectListRow[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    const result = compare(a, b, key);
    // Undated rows are pinned last by returning ±1 above; don't flip them.
    if (key === "target_date" && (!a.target_date || !b.target_date)) {
      return result;
    }
    return result * factor;
  });
}

// --- CSV export -------------------------------------------------------------
const CSV_HEADERS = [
  "Project",
  "Client",
  "Type",
  "Manager",
  "Status",
  "Progress",
  "Priority",
  "Next milestone",
  "Milestone detail",
  "Due date",
];

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(projects: ProjectListRow[], today: Date): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const p of projects) {
    const milestone = nextMilestone(p, today);
    lines.push(
      [
        p.name,
        p.client?.company_name ?? "",
        PROJECT_TYPE_LABELS[p.project_type],
        p.manager?.full_name ?? "",
        PROJECT_STATUS_LABELS[p.status],
        `${p.progress}%`,
        PRIORITY_LABELS[p.priority],
        milestone?.title ?? "",
        milestone?.detail ?? "",
        p.target_date ? format(new Date(p.target_date), "d MMM yyyy") : "",
      ]
        .map(escapeCell)
        .join(",")
    );
  }
  return lines.join("\r\n");
}
