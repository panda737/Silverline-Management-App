import type {
  DocType,
  Priority,
  ProjectStatus,
  ProjectType,
  TaskStatus,
  TimelineStatus,
  UserRole,
} from "@/lib/database.types";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  waste_management_licence: "Waste Management Licence",
  norms_and_standards: "Norms & Standards",
  audit: "Audit",
  compliance_assessment: "Compliance Assessment",
  public_participation: "Public Participation",
  other: "Other",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on Client",
  waiting_on_authority: "Waiting on Authority",
  drafting: "Drafting",
  submitted: "Submitted",
  approved: "Approved",
  completed: "Completed",
  on_hold: "On Hold",
  at_risk: "At Risk",
  cancelled: "Cancelled",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TIMELINE_STATUS_LABELS: Record<TimelineStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  waiting: "Waiting",
  review: "Review",
  done: "Done",
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  application: "Application",
  audit_report: "Audit Report",
  draft_report: "Draft Report",
  final_report: "Final Report",
  ppp_document: "PPP Document",
  authority_correspondence: "Authority Correspondence",
  client_information: "Client Information",
  licence_approval: "Licence / Approval",
  supporting_document: "Supporting Document",
  other: "Other",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  client: "Client",
};

export const PROJECT_TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[];
export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[];
