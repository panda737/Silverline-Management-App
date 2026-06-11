import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TIMELINE_STATUS_LABELS,
  USER_ROLE_LABELS,
} from "@/lib/labels";
import {
  ACTIVITY_TRIGGERED_LABELS,
  DEADLINE_STATUS_LABELS,
  DOC_REQ_STATUS_LABELS,
  RISK_LABELS,
} from "@/lib/wml";
import type {
  ActivityTriggered,
  DeadlineStatus,
  DocReqStatus,
  Priority,
  ProjectStatus,
  RiskLevel,
  TaskStatus,
  TimelineStatus,
  UserRole,
} from "@/lib/database.types";

/** Slim Supabase-style pill: tinted bg, subtle border, colored text. */
function Pill({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-px text-[11px] leading-[18px] font-medium whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

const neutral =
  "border-border bg-muted text-muted-foreground";
const green =
  "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
const amber =
  "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400";
const sky =
  "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400";
const violet =
  "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-400";
const blue =
  "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400";
const orange =
  "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-400";
const red =
  "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400";

const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
  not_started: neutral,
  in_progress: green,
  waiting_on_client: amber,
  waiting_on_authority: sky,
  drafting: violet,
  submitted: blue,
  approved: green,
  completed: green,
  on_hold: orange,
  at_risk: red,
  cancelled: cn(neutral, "line-through"),
};

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: neutral,
  medium: sky,
  high: amber,
  urgent: red,
};

const TIMELINE_STATUS_CLASSES: Record<TimelineStatus, string> = {
  pending: neutral,
  in_progress: green,
  completed: green,
  skipped: neutral,
};

const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  todo: neutral,
  in_progress: green,
  waiting: amber,
  review: violet,
  done: green,
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Pill className={PROJECT_STATUS_CLASSES[status]}>
      {PROJECT_STATUS_LABELS[status]}
    </Pill>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Pill className={PRIORITY_CLASSES[priority]}>
      {PRIORITY_LABELS[priority]}
    </Pill>
  );
}

export function TimelineStatusBadge({ status }: { status: TimelineStatus }) {
  return (
    <Pill className={TIMELINE_STATUS_CLASSES[status]}>
      {TIMELINE_STATUS_LABELS[status]}
    </Pill>
  );
}

const USER_ROLE_CLASSES: Record<UserRole, string> = {
  admin: violet,
  staff: green,
  client: sky,
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return <Pill className={USER_ROLE_CLASSES[role]}>{USER_ROLE_LABELS[role]}</Pill>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Pill className={active ? green : neutral}>
      {active ? "Active" : "Deactivated"}
    </Pill>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Pill className={TASK_STATUS_CLASSES[status]}>
      {TASK_STATUS_LABELS[status]}
    </Pill>
  );
}

// --- WML module badges ------------------------------------------------------
const RISK_CLASSES: Record<RiskLevel, string> = {
  low: green,
  medium: amber,
  high: orange,
  critical: red,
};

const DOC_REQ_STATUS_CLASSES: Record<DocReqStatus, string> = {
  missing: red,
  uploaded: sky,
  approved: green,
  not_applicable: neutral,
};

const ACTIVITY_TRIGGERED_CLASSES: Record<ActivityTriggered, string> = {
  yes: green,
  no: neutral,
  tbc: amber,
};

const DEADLINE_STATUS_CLASSES: Record<DeadlineStatus, string> = {
  not_started: neutral,
  running: sky,
  due_soon: amber,
  overdue: red,
  completed: green,
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Pill className={RISK_CLASSES[level]}>{RISK_LABELS[level]}</Pill>;
}

export function DocReqStatusBadge({ status }: { status: DocReqStatus }) {
  return <Pill className={DOC_REQ_STATUS_CLASSES[status]}>{DOC_REQ_STATUS_LABELS[status]}</Pill>;
}

export function ActivityTriggeredBadge({ value }: { value: ActivityTriggered }) {
  return (
    <Pill className={ACTIVITY_TRIGGERED_CLASSES[value]}>
      {ACTIVITY_TRIGGERED_LABELS[value]}
    </Pill>
  );
}

export function DeadlineStatusBadge({ status }: { status: DeadlineStatus }) {
  return (
    <Pill className={DEADLINE_STATUS_CLASSES[status]}>
      {DEADLINE_STATUS_LABELS[status]}
    </Pill>
  );
}
