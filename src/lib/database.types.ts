/**
 * Hand-maintained database types mirroring supabase/migrations.
 * Update this file whenever a migration changes the schema.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "staff" | "client";

export type ProjectType =
  | "waste_management_licence"
  | "atmospheric_emission_licence"
  | "norms_and_standards"
  | "audit"
  | "compliance_assessment"
  | "public_participation"
  | "other";

export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "waiting_on_client"
  | "waiting_on_authority"
  | "drafting"
  | "submitted"
  | "approved"
  | "completed"
  | "on_hold"
  | "at_risk"
  | "cancelled";

export type Priority = "low" | "medium" | "high" | "urgent";

export type DocType =
  | "application"
  | "audit_report"
  | "draft_report"
  | "final_report"
  | "ppp_document"
  | "authority_correspondence"
  | "client_information"
  | "licence_approval"
  | "supporting_document"
  | "other";

export type TimelineStatus = "pending" | "in_progress" | "completed" | "skipped";

export type TaskStatus = "todo" | "in_progress" | "waiting" | "review" | "done";

export type CommentVisibility = "internal" | "client";

// --- Waste Management Licence (WML) module ---------------------------------
export type WmlRoute = "category_a" | "category_b" | "category_c" | "section_24g";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type DocReqStatus = "missing" | "uploaded" | "approved" | "not_applicable";

export type ActivityTriggered = "yes" | "no" | "tbc";

export type DeadlineStatus =
  | "not_started"
  | "running"
  | "due_soon"
  | "overdue"
  | "completed";

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  client_id: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientRow = {
  id: string;
  company_name: string;
  industry: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientContactRow = {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectRow = {
  id: string;
  name: string;
  client_id: string;
  project_type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  manager_id: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  description: string | null;
  client_summary: string | null;
  progress: number;
  created_by: string | null;
  // WML module (null for non-WML projects)
  route: WmlRoute | null;
  applicant: string | null;
  current_legal_stage: string | null;
  current_step: string | null;
  next_action: string | null;
  risk_level: RiskLevel | null;
  risk_reason: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectMemberRow = {
  id: string;
  project_id: string;
  profile_id: string;
  role_on_project: string | null;
  created_at: string;
  updated_at: string;
}

export type TimelineTemplateRow = {
  id: string;
  project_type: ProjectType;
  stage_name: string;
  description: string | null;
  sort_order: number;
  default_client_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectTimelineItemRow = {
  id: string;
  project_id: string;
  stage_name: string;
  status: TimelineStatus;
  description: string | null;
  due_date: string | null;
  completed_date: string | null;
  assigned_to: string | null;
  client_visible: boolean;
  client_update_text: string | null;
  internal_notes: string | null;
  sort_order: number;
  // WML module
  stage_key: string | null;
  completion_requirements: string | null;
  risk_flag: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectListedActivityRow = {
  id: string;
  project_id: string;
  activity_number: string;
  category: string | null;
  description: string | null;
  waste_stream: string | null;
  threshold: string | null;
  project_capacity: string | null;
  triggered: ActivityTriggered;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectDocumentRequirementRow = {
  id: string;
  project_id: string;
  doc_key: string | null;
  name: string;
  linked_stage_key: string | null;
  required: boolean;
  status: DocReqStatus;
  na_reason: string | null;
  upload_date: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectDeadlineRow = {
  id: string;
  project_id: string;
  deadline_key: string | null;
  name: string;
  linked_stage_key: string | null;
  trigger_date: string | null;
  due_date: string | null;
  status: DeadlineStatus;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  completed_date: string | null;
  created_by: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskCommentRow = {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export type DocumentRow = {
  id: string;
  project_id: string;
  name: string;
  doc_type: DocType;
  storage_path: string;
  version: number;
  status: string;
  client_visible: boolean;
  uploaded_by: string | null;
  notes: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Per-project document folder. `folder_key` is set on the seeded standard set. */
export type ProjectFolderRow = {
  id: string;
  project_id: string;
  name: string;
  folder_key: string | null;
  /** null = root folder. Nesting is capped at one level deep. */
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectCommentRow = {
  id: string;
  project_id: string;
  author_id: string | null;
  body: string;
  visibility: CommentVisibility;
  created_at: string;
  updated_at: string;
}

export type ActivityLogRow = {
  id: string;
  project_id: string | null;
  actor_id: string | null;
  action: string;
  details: Json;
  created_at: string;
  updated_at: string;
}

export type NotificationRow = {
  id: string;
  recipient_id: string;
  type: string;
  payload: Json;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// Client portal views (client-safe columns only)
export type PortalCompanyRow = {
  id: string;
  company_name: string;
  industry: string | null;
}

export type PortalProjectRow = {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  client_summary: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  manager_name: string | null;
}

export type PortalTimelineItemRow = {
  id: string;
  project_id: string;
  stage_name: string;
  status: TimelineStatus;
  description: string | null;
  due_date: string | null;
  completed_date: string | null;
  client_update_text: string | null;
  sort_order: number;
}

export type PortalDocumentRow = {
  id: string;
  project_id: string;
  name: string;
  doc_type: DocType;
  version: number;
  status: string;
  storage_path: string;
  created_at: string;
}

export type ProjectFactRow = {
  id: string;
  project_id: string;
  section: "team" | "operation" | "evidence" | "outstanding" | "commencement";
  label: string;
  value: string | null;
  source_note: string | null;
  sort_order: number;
  sensitivity: "client_safe" | "internal_only" | "withheld";
  sensitivity_note: string | null;
  confirmable: boolean;
  created_at: string;
  updated_at: string;
}

export type ProjectFactResponseRow = {
  id: string;
  fact_id: string;
  project_id: string;
  state: "confirmed" | "disputed";
  comment: string | null;
  responded_by: string | null;
  created_at: string;
}

export type PortalClockEventRow = {
  id: string;
  project_id: string;
  event_date: string | null;
  label: string;
  detail: string | null;
  source_note: string | null;
  kind: "done" | "now" | "expected";
  sort_order: number;
}

export type PortalFactRow = {
  id: string;
  project_id: string;
  section: "team" | "operation" | "evidence" | "outstanding" | "commencement";
  label: string;
  value: string | null;
  source_note: string | null;
  sort_order: number;
  confirmable: boolean;
  response_state: "confirmed" | "disputed" | null;
  response_comment: string | null;
  responded_at: string | null;
}

export type PortalUpdateRow = {
  id: string;
  project_id: string;
  body: string;
  created_at: string;
  author_name: string | null;
  project_name: string;
}

// --- Project chat -----------------------------------------------------------
export type ChatMessageRole = "user" | "assistant";

export type ChatThreadRow = {
  id: string;
  owner_id: string;
  /** null = a portfolio-wide conversation; set = pinned to one project. */
  project_id: string | null;
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

/** One tool the assistant ran for a turn, kept so an answer can be traced back
 *  to the records behind it. */
export type ChatToolCall = {
  name: string;
  input: Json;
  summary: string;
}

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  role: ChatMessageRole;
  content: string;
  tool_calls: ChatToolCall[];
  error_message: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_tokens: number | null;
  created_at: string;
}

/** Where a document review has got to. */
export type ReviewStatus = "pending" | "changes_requested" | "approved";

/** One publish event to one reviewer — the unit a notification email covers. */
export type ReviewBatchRow = {
  id: string;
  reviewer_id: string;
  created_by: string | null;
  note: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A review is pinned to a document VERSION: if the source is republished the
 * reviewer's comments still describe the text they actually read.
 */
export type DocumentReviewRow = {
  id: string;
  document_id: string;
  document_version: number;
  reviewer_id: string;
  batch_id: string | null;
  status: ReviewStatus;
  decision_note: string | null;
  annotated_storage_path: string | null;
  annotated_at: string | null;
  assigned_by: string | null;
  assigned_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Anchored to a heading slug, not a character range. Null key = whole document. */
export type DocumentCommentRow = {
  id: string;
  document_id: string;
  review_id: string | null;
  author_id: string | null;
  section_key: string | null;
  section_title: string | null;
  body: string;
  /** Verbatim selected text; null for a section- or document-level remark. */
  quote: string | null;
  /** Offset of quote within the section's plain text; picks the right repeat. */
  quote_start: number | null;
  /** Proposed replacement wording. Null = plain comment, not a suggestion. */
  suggested_text: string | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

import type { LicenceAuditRow } from "./licence-audit";

type TableType<Row, Optional extends keyof Row> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

type CommonOptional = "id" | "created_at" | "updated_at";

export type Database = {
  public: {
    Tables: {
      profiles: TableType<
        ProfileRow,
        "created_at" | "updated_at" | "full_name" | "email" | "role" | "client_id" | "avatar_url" | "active"
      >;
      clients: TableType<
        ClientRow,
        CommonOptional | "industry" | "address" | "notes" | "created_by"
      >;
      client_contacts: TableType<
        ClientContactRow,
        CommonOptional | "email" | "phone" | "role_title" | "is_primary"
      >;
      projects: TableType<
        ProjectRow,
        | CommonOptional
        | "status"
        | "priority"
        | "manager_id"
        | "start_date"
        | "target_date"
        | "completed_date"
        | "description"
        | "client_summary"
        | "progress"
        | "created_by"
        | "route"
        | "applicant"
        | "current_legal_stage"
        | "current_step"
        | "next_action"
        | "risk_level"
        | "risk_reason"
        | "due_date"
      >;
      project_members: TableType<ProjectMemberRow, CommonOptional | "role_on_project">;
      timeline_templates: TableType<
        TimelineTemplateRow,
        CommonOptional | "description" | "default_client_visible"
      >;
      project_timeline_items: TableType<
        ProjectTimelineItemRow,
        | CommonOptional
        | "status"
        | "description"
        | "due_date"
        | "completed_date"
        | "assigned_to"
        | "client_visible"
        | "client_update_text"
        | "internal_notes"
        | "sort_order"
        | "stage_key"
        | "completion_requirements"
        | "risk_flag"
      >;
      project_listed_activities: TableType<
        ProjectListedActivityRow,
        | CommonOptional
        | "activity_number"
        | "category"
        | "description"
        | "waste_stream"
        | "threshold"
        | "project_capacity"
        | "triggered"
        | "notes"
        | "sort_order"
      >;
      project_document_requirements: TableType<
        ProjectDocumentRequirementRow,
        | CommonOptional
        | "doc_key"
        | "linked_stage_key"
        | "required"
        | "status"
        | "na_reason"
        | "upload_date"
        | "notes"
        | "sort_order"
      >;
      project_deadlines: TableType<
        ProjectDeadlineRow,
        | CommonOptional
        | "deadline_key"
        | "linked_stage_key"
        | "trigger_date"
        | "due_date"
        | "status"
        | "notes"
        | "sort_order"
      >;
      tasks: TableType<
        TaskRow,
        | CommonOptional
        | "description"
        | "assigned_to"
        | "priority"
        | "status"
        | "due_date"
        | "completed_date"
        | "created_by"
        | "internal_notes"
      >;
      task_comments: TableType<TaskCommentRow, CommonOptional | "author_id">;
      documents: TableType<
        DocumentRow,
        | CommonOptional
        | "doc_type"
        | "version"
        | "status"
        | "client_visible"
        | "uploaded_by"
        | "notes"
        | "folder_id"
      >;
      project_folders: TableType<
        ProjectFolderRow,
        CommonOptional | "folder_key" | "sort_order" | "parent_id"
      >;
      project_comments: TableType<ProjectCommentRow, CommonOptional | "author_id" | "visibility">;
      review_batches: TableType<
        ReviewBatchRow,
        CommonOptional | "created_by" | "note" | "notified_at"
      >;
      document_reviews: TableType<
        DocumentReviewRow,
        | CommonOptional
        | "batch_id"
        | "status"
        | "decision_note"
        | "annotated_storage_path"
        | "annotated_at"
        | "assigned_by"
        | "assigned_at"
        | "completed_at"
      >;
      document_comments: TableType<
        DocumentCommentRow,
        | CommonOptional
        | "review_id"
        | "author_id"
        | "section_key"
        | "section_title"
        | "resolved"
        | "resolved_by"
        | "resolved_at"
      >;
      activity_log: TableType<
        ActivityLogRow,
        CommonOptional | "project_id" | "actor_id" | "details"
      >;
      notifications: TableType<NotificationRow, CommonOptional | "payload" | "read_at">;
      licence_audits: TableType<
        LicenceAuditRow,
        | CommonOptional
        | "created_by"
        | "client_id"
        | "file_name"
        | "storage_path"
        | "page_count"
        | "processing_status"
        | "processing_note"
        | "error_message"
        | "doc_type"
        | "doc_type_label"
        | "doc_summary"
        | "metadata"
        | "sections"
        | "audit_status"
        | "auditor_name"
        | "audit_date"
        | "exec_summary"
      >;
      project_facts: TableType<
        ProjectFactRow,
        CommonOptional | "value" | "source_note" | "sort_order" | "sensitivity" | "sensitivity_note" | "confirmable"
      >;
      project_fact_responses: TableType<
        ProjectFactResponseRow,
        "id" | "created_at" | "comment" | "responded_by"
      >;
      chat_threads: TableType<
        ChatThreadRow,
        CommonOptional | "project_id" | "title" | "last_message_at"
      >;
      chat_messages: TableType<
        ChatMessageRow,
        | "id"
        | "created_at"
        | "content"
        | "tool_calls"
        | "error_message"
        | "model"
        | "input_tokens"
        | "output_tokens"
        | "cache_read_tokens"
      >;
    };
    Views: {
      portal_company: { Row: PortalCompanyRow; Relationships: [] };
      portal_projects: { Row: PortalProjectRow; Relationships: [] };
      portal_timeline_items: { Row: PortalTimelineItemRow; Relationships: [] };
      portal_documents: { Row: PortalDocumentRow; Relationships: [] };
      portal_updates: { Row: PortalUpdateRow; Relationships: [] };
      portal_facts: { Row: PortalFactRow; Relationships: [] };
      portal_clock_events: { Row: PortalClockEventRow; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_internal: { Args: Record<string, never>; Returns: boolean };
      my_client_id: { Args: Record<string, never>; Returns: string | null };
      can_edit_project: { Args: { pid: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      project_type: ProjectType;
      project_status: ProjectStatus;
      priority: Priority;
      doc_type: DocType;
      timeline_status: TimelineStatus;
      task_status: TaskStatus;
      comment_visibility: CommentVisibility;
      chat_message_role: ChatMessageRole;
      review_status: ReviewStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
