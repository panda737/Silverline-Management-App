import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TIMELINE_STATUS_LABELS,
} from "@/lib/labels";
import type {
  Priority,
  ProjectStatus,
  TaskStatus,
  TimelineStatus,
} from "@/lib/database.types";

const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  not_started:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  in_progress:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  waiting_on_client:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  waiting_on_authority:
    "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  drafting:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  approved: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  on_hold:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  at_risk: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  cancelled:
    "bg-neutral-200 text-neutral-500 line-through dark:bg-neutral-800 dark:text-neutral-400",
};

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  medium: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const TIMELINE_STATUS_CLASSES: Record<TimelineStatus, string> = {
  pending:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  in_progress:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  skipped:
    "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  todo: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  in_progress:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  waiting: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  review: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  done: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

const badgeBase = "border-transparent font-medium";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={cn(badgeBase, PROJECT_STATUS_CLASSES[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={cn(badgeBase, PRIORITY_CLASSES[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function TimelineStatusBadge({ status }: { status: TimelineStatus }) {
  return (
    <Badge className={cn(badgeBase, TIMELINE_STATUS_CLASSES[status])}>
      {TIMELINE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={cn(badgeBase, TASK_STATUS_CLASSES[status])}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
