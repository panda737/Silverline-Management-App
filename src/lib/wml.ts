/**
 * Waste Management Licence (WML) Application — domain data + helpers.
 *
 * Single source of truth for WML route logic. The database only stores
 * per-project instances (timeline items, document requirements, deadlines);
 * generation copies from the definitions here. Keeping the route logic in code
 * keeps it simple and easy to tweak.
 */
import type {
  ActivityTriggered,
  DeadlineStatus,
  DocReqStatus,
  ProjectDeadlineRow,
  ProjectDocumentRequirementRow,
  RiskLevel,
  WmlRoute,
} from "@/lib/database.types";

// --- Routes -----------------------------------------------------------------
export const WML_ROUTES: Record<WmlRoute, { label: string; short: string; note?: string }> = {
  category_a: { label: "Category A — Basic Assessment", short: "Category A" },
  category_b: { label: "Category B — Scoping and EIR", short: "Category B" },
  category_c: {
    label: "Category C — Norms and Standards / Registration",
    short: "Category C",
    note: "Category C is not a full Basic Assessment or Scoping / EIR WML route.",
  },
};

export const WML_ROUTE_KEYS = Object.keys(WML_ROUTES) as WmlRoute[];

// --- Stages -----------------------------------------------------------------
export type StageDef = {
  key: string;
  name: string;
  description: string;
  /** Weighted progress (0–100) when this stage is the current legal stage. */
  weight: number;
  clientVisible: boolean;
};

const A: StageDef[] = [
  { key: "intake", name: "Project intake", description: "Project opened; mandate and applicant details captured.", weight: 5, clientVisible: true },
  { key: "legal_activity_screening", name: "Legal activity screening", description: "Listed activities screened and confirmed against NEMWA.", weight: 10, clientVisible: false },
  { key: "site_info_received", name: "Site information received", description: "Site, land and operational information received from the client.", weight: 15, clientVisible: true },
  { key: "eap_appointed", name: "EAP appointed", description: "Environmental Assessment Practitioner appointed and declared.", weight: 20, clientVisible: true },
  { key: "application_submitted", name: "WML application submitted", description: "Application submitted to the competent authority.", weight: 30, clientVisible: true },
  { key: "draft_bar_prepared", name: "Draft BAR and EMPr prepared", description: "Draft Basic Assessment Report and EMPr prepared.", weight: 40, clientVisible: true },
  { key: "ppp_opened", name: "Public participation opened", description: "Public participation process opened with I&APs.", weight: 48, clientVisible: true },
  { key: "ppp_closed", name: "Public participation closed", description: "Comment period closed; comments and responses compiled.", weight: 58, clientVisible: true },
  { key: "final_bar_submitted", name: "Final BAR submitted", description: "Final BAR and EMPr submitted to the authority.", weight: 70, clientVisible: true },
  { key: "authority_decision_period", name: "Authority decision period", description: "Authority considering the application; responding to queries.", weight: 85, clientVisible: true },
  { key: "decision_issued", name: "WML decision issued", description: "Decision (grant or refusal) issued by the authority.", weight: 92, clientVisible: true },
  { key: "appeal_period", name: "Appeal period", description: "Statutory appeal window running.", weight: 96, clientVisible: true },
  { key: "licence_conditions_captured", name: "Licence conditions captured", description: "Licence conditions captured into the obligation register.", weight: 99, clientVisible: true },
  { key: "close_out", name: "Project close-out", description: "Deliverables handed over and project closed out.", weight: 100, clientVisible: true },
];

const B: StageDef[] = [
  { key: "intake", name: "Project intake", description: "Project opened; mandate and applicant details captured.", weight: 5, clientVisible: true },
  { key: "legal_activity_screening", name: "Legal activity screening", description: "Listed activities screened and confirmed against NEMWA.", weight: 10, clientVisible: false },
  { key: "site_info_received", name: "Site information received", description: "Site, land and operational information received from the client.", weight: 12, clientVisible: true },
  { key: "eap_appointed", name: "EAP appointed", description: "Environmental Assessment Practitioner appointed and declared.", weight: 15, clientVisible: true },
  { key: "application_submitted", name: "WML application submitted", description: "Application submitted to the competent authority.", weight: 25, clientVisible: true },
  { key: "draft_scoping_prepared", name: "Draft Scoping Report prepared", description: "Draft Scoping Report prepared for public participation.", weight: 30, clientVisible: true },
  { key: "scoping_ppp_opened", name: "Scoping public participation opened", description: "Scoping comment period opened with I&APs.", weight: 33, clientVisible: true },
  { key: "scoping_ppp_closed", name: "Scoping public participation closed", description: "Scoping comment period closed; comments compiled.", weight: 38, clientVisible: true },
  { key: "final_scoping_submitted", name: "Final Scoping Report submitted", description: "Final Scoping Report submitted to the authority.", weight: 45, clientVisible: true },
  { key: "authority_review_scoping", name: "Authority review of Final Scoping Report", description: "Authority reviewing the Final Scoping Report.", weight: 45, clientVisible: true },
  { key: "scoping_accepted", name: "Scoping accepted", description: "Final Scoping Report accepted by the authority.", weight: 55, clientVisible: true },
  { key: "specialist_studies_completed", name: "Specialist studies completed", description: "Specialist studies required by the accepted scope completed.", weight: 65, clientVisible: true },
  { key: "draft_eir_prepared", name: "Draft EIR and EMPr prepared", description: "Draft Environmental Impact Report and EMPr prepared.", weight: 72, clientVisible: true },
  { key: "eir_ppp_opened", name: "EIR public participation opened", description: "EIR comment period opened with I&APs.", weight: 75, clientVisible: true },
  { key: "eir_ppp_closed", name: "EIR public participation closed", description: "EIR comment period closed; comments compiled.", weight: 80, clientVisible: true },
  { key: "final_eir_submitted", name: "Final EIR and EMPr submitted", description: "Final EIR and EMPr submitted to the authority.", weight: 85, clientVisible: true },
  { key: "authority_final_decision", name: "Authority final decision period", description: "Authority considering the final decision; responding to queries.", weight: 90, clientVisible: true },
  { key: "decision_issued", name: "WML decision issued", description: "Decision (grant or refusal) issued by the authority.", weight: 93, clientVisible: true },
  { key: "appeal_period", name: "Appeal period", description: "Statutory appeal window running.", weight: 97, clientVisible: true },
  { key: "licence_conditions_captured", name: "Licence conditions captured", description: "Licence conditions captured into the obligation register.", weight: 99, clientVisible: true },
  { key: "close_out", name: "Project close-out", description: "Deliverables handed over and project closed out.", weight: 100, clientVisible: true },
];

const C: StageDef[] = [
  { key: "intake", name: "Project intake", description: "Project opened; mandate and applicant details captured.", weight: 8, clientVisible: true },
  { key: "legal_activity_screening", name: "Legal activity screening", description: "Listed activities screened and confirmed against NEMWA.", weight: 18, clientVisible: false },
  { key: "norms_route_confirmed", name: "Norms and standards route confirmed", description: "Registration under the applicable norms and standards confirmed.", weight: 30, clientVisible: true },
  { key: "facility_info_received", name: "Facility information received", description: "Facility and operational information received from the client.", weight: 42, clientVisible: true },
  { key: "waste_streams_confirmed", name: "Waste streams and capacity confirmed", description: "Waste streams and processing capacity confirmed.", weight: 55, clientVisible: true },
  { key: "registration_pack_prepared", name: "Registration pack prepared", description: "Registration documentation pack prepared.", weight: 68, clientVisible: true },
  { key: "registration_submitted", name: "Registration submitted", description: "Registration submitted to the competent authority.", weight: 80, clientVisible: true },
  { key: "authority_acknowledgement", name: "Authority acknowledgement received", description: "Acknowledgement of registration received from the authority.", weight: 90, clientVisible: true },
  { key: "compliance_obligations_captured", name: "Compliance obligations captured", description: "Compliance obligations captured into the register.", weight: 96, clientVisible: true },
  { key: "close_out", name: "Project close-out", description: "Deliverables handed over and project closed out.", weight: 100, clientVisible: true },
];

export const WML_STAGES: Record<WmlRoute, StageDef[]> = {
  category_a: A,
  category_b: B,
  category_c: C,
};

// --- Documents (checklist catalogue) ---------------------------------------
export type DocDef = {
  key: string;
  name: string;
  linkedStageKey: string;
  required: boolean;
  routes: WmlRoute[];
};

const ALL: WmlRoute[] = ["category_a", "category_b", "category_c"];
const AB: WmlRoute[] = ["category_a", "category_b"];

export const WML_DOCUMENTS: DocDef[] = [
  { key: "client_mandate", name: "Client mandate", linkedStageKey: "intake", required: true, routes: ALL },
  { key: "applicant_details", name: "Applicant details", linkedStageKey: "intake", required: true, routes: ALL },
  { key: "listed_activities_table", name: "Listed activities table", linkedStageKey: "legal_activity_screening", required: true, routes: ALL },
  { key: "waste_stream_schedule", name: "Waste stream schedule", linkedStageKey: "legal_activity_screening", required: true, routes: ALL },
  { key: "landowner_consent", name: "Landowner consent", linkedStageKey: "site_info_received", required: true, routes: AB },
  { key: "title_deed", name: "Title deed / land rights", linkedStageKey: "site_info_received", required: true, routes: AB },
  { key: "zoning_confirmation", name: "Zoning confirmation", linkedStageKey: "site_info_received", required: true, routes: AB },
  { key: "sg_diagram", name: "SG diagram", linkedStageKey: "site_info_received", required: false, routes: AB },
  { key: "site_layout", name: "Site layout", linkedStageKey: "site_info_received", required: true, routes: AB },
  { key: "process_flow", name: "Process flow", linkedStageKey: "site_info_received", required: true, routes: AB },
  { key: "eap_appointment_letter", name: "EAP appointment letter", linkedStageKey: "eap_appointed", required: true, routes: AB },
  { key: "eap_declaration", name: "EAP declaration", linkedStageKey: "eap_appointed", required: true, routes: AB },
  { key: "screening_tool_report", name: "Screening Tool report", linkedStageKey: "eap_appointed", required: true, routes: AB },
  { key: "wml_application_form", name: "WML application form", linkedStageKey: "application_submitted", required: true, routes: AB },
  { key: "specialist_reports", name: "Specialist reports", linkedStageKey: "specialist_studies_completed", required: true, routes: ["category_b"] },
  { key: "draft_bar", name: "Draft BAR", linkedStageKey: "draft_bar_prepared", required: true, routes: ["category_a"] },
  { key: "final_bar", name: "Final BAR", linkedStageKey: "final_bar_submitted", required: true, routes: ["category_a"] },
  { key: "draft_scoping_report", name: "Draft Scoping Report", linkedStageKey: "draft_scoping_prepared", required: true, routes: ["category_b"] },
  { key: "final_scoping_report", name: "Final Scoping Report", linkedStageKey: "final_scoping_submitted", required: true, routes: ["category_b"] },
  { key: "draft_eir", name: "Draft EIR", linkedStageKey: "draft_eir_prepared", required: true, routes: ["category_b"] },
  { key: "final_eir", name: "Final EIR", linkedStageKey: "final_eir_submitted", required: true, routes: ["category_b"] },
  { key: "empr", name: "EMPr", linkedStageKey: "application_submitted", required: true, routes: AB },
  { key: "ppp_proof", name: "PPP proof", linkedStageKey: "application_submitted", required: true, routes: AB },
  { key: "comments_responses", name: "Comments and responses report", linkedStageKey: "application_submitted", required: true, routes: AB },
  { key: "authority_correspondence", name: "Authority correspondence", linkedStageKey: "application_submitted", required: false, routes: ALL },
  { key: "decision_letter", name: "Decision letter", linkedStageKey: "decision_issued", required: true, routes: AB },
  { key: "waste_management_licence", name: "Waste Management Licence", linkedStageKey: "decision_issued", required: true, routes: AB },
  { key: "appeal_documents", name: "Appeal documents", linkedStageKey: "appeal_period", required: false, routes: AB },
  { key: "licence_condition_register", name: "Licence condition register", linkedStageKey: "licence_conditions_captured", required: true, routes: AB },
  { key: "close_out_pack", name: "Close-out pack", linkedStageKey: "close_out", required: true, routes: ALL },
  // Category C — registration specifics
  { key: "facility_information", name: "Facility information", linkedStageKey: "facility_info_received", required: true, routes: ["category_c"] },
  { key: "waste_capacity_confirmation", name: "Waste streams and capacity confirmation", linkedStageKey: "waste_streams_confirmed", required: true, routes: ["category_c"] },
  { key: "registration_pack", name: "Registration pack", linkedStageKey: "registration_pack_prepared", required: true, routes: ["category_c"] },
  { key: "registration_acknowledgement", name: "Registration acknowledgement", linkedStageKey: "authority_acknowledgement", required: true, routes: ["category_c"] },
  { key: "compliance_register", name: "Compliance obligation register", linkedStageKey: "compliance_obligations_captured", required: true, routes: ["category_c"] },
];

// --- Deadlines (default timeframes) ----------------------------------------
export type DeadlineDef = {
  key: string;
  name: string;
  linkedStageKey: string;
  /** Days from the generation date; the due date is editable afterwards. */
  offsetDays: number;
};

export const WML_DEADLINES: Record<WmlRoute, DeadlineDef[]> = {
  category_a: [
    { key: "ppp_min", name: "Minimum comment period (PPP)", linkedStageKey: "ppp_opened", offsetDays: 30 },
    { key: "final_bar_due", name: "Final BAR due", linkedStageKey: "final_bar_submitted", offsetDays: 90 },
    { key: "authority_decision", name: "Authority decision after BAR", linkedStageKey: "authority_decision_period", offsetDays: 107 },
    { key: "decision_notification", name: "Decision notification", linkedStageKey: "decision_issued", offsetDays: 14 },
    { key: "appeal_window", name: "Appeal window", linkedStageKey: "appeal_period", offsetDays: 20 },
  ],
  category_b: [
    { key: "final_scoping_due", name: "Final Scoping Report due", linkedStageKey: "final_scoping_submitted", offsetDays: 44 },
    { key: "authority_review_scoping", name: "Authority review of Final Scoping Report", linkedStageKey: "authority_review_scoping", offsetDays: 43 },
    { key: "ppp_min", name: "Minimum comment period (PPP)", linkedStageKey: "scoping_ppp_opened", offsetDays: 30 },
    { key: "final_eir_due", name: "Final EIR / EMPr due", linkedStageKey: "final_eir_submitted", offsetDays: 106 },
    { key: "authority_final_decision", name: "Authority final decision after EIR", linkedStageKey: "authority_final_decision", offsetDays: 107 },
    { key: "decision_notification", name: "Decision notification", linkedStageKey: "decision_issued", offsetDays: 14 },
    { key: "appeal_window", name: "Appeal window", linkedStageKey: "appeal_period", offsetDays: 20 },
  ],
  category_c: [],
};

// --- Labels -----------------------------------------------------------------
export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const DOC_REQ_STATUS_LABELS: Record<DocReqStatus, string> = {
  missing: "Missing",
  uploaded: "Uploaded",
  approved: "Approved",
  not_applicable: "Not Applicable",
};

export const ACTIVITY_TRIGGERED_LABELS: Record<ActivityTriggered, string> = {
  yes: "Yes",
  no: "No",
  tbc: "To be confirmed",
};

export const DEADLINE_STATUS_LABELS: Record<DeadlineStatus, string> = {
  not_started: "Not started",
  running: "Running",
  due_soon: "Due soon",
  overdue: "Overdue",
  completed: "Completed",
};

export const RISK_KEYS = Object.keys(RISK_LABELS) as RiskLevel[];
export const DOC_REQ_STATUS_KEYS = Object.keys(DOC_REQ_STATUS_LABELS) as DocReqStatus[];
export const ACTIVITY_TRIGGERED_KEYS = Object.keys(ACTIVITY_TRIGGERED_LABELS) as ActivityTriggered[];

// --- Helpers ----------------------------------------------------------------
export function routeStages(route: WmlRoute): StageDef[] {
  return WML_STAGES[route] ?? [];
}

export function stageDef(route: WmlRoute, key: string | null): StageDef | undefined {
  if (!key) return undefined;
  return routeStages(route).find((s) => s.key === key);
}

/** Resolve a stage key to a display name within a route ("General" if unknown). */
export function resolveStageName(route: WmlRoute | null, key: string | null): string {
  if (!key) return "—";
  if (route) {
    const s = stageDef(route, key);
    if (s) return s.name;
  }
  // Fall back to any route's definition, else a humanised key.
  for (const r of WML_ROUTE_KEYS) {
    const s = WML_STAGES[r].find((st) => st.key === key);
    if (s) return s.name;
  }
  return "General";
}

/** Weighted progress (0–100) for the current legal stage. */
export function stageWeight(route: WmlRoute | null, currentLegalStage: string | null): number {
  if (!route) return 0;
  return stageDef(route, currentLegalStage)?.weight ?? 0;
}

export function documentsForRoute(route: WmlRoute): DocDef[] {
  return WML_DOCUMENTS.filter((d) => d.routes.includes(route));
}

export function deadlinesForRoute(route: WmlRoute): DeadlineDef[] {
  return WML_DEADLINES[route] ?? [];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from today until `due` (negative = overdue). null if no date. */
export function daysRemaining(due: string | null, from: Date = new Date()): number | null {
  if (!due) return null;
  const target = startOfDay(new Date(due));
  const today = startOfDay(from);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Derive a deadline status from its due date and completion flag. */
export function deadlineStatusFor(
  due: string | null,
  completed: boolean,
  from: Date = new Date()
): DeadlineStatus {
  if (completed) return "completed";
  const days = daysRemaining(due, from);
  if (days === null) return "not_started";
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "running";
}

export type RiskAssessment = { level: RiskLevel; reason: string };

/**
 * Simple risk derivation from deadlines, document requirements and status.
 * Used as a suggested risk; a manually set risk_level/risk_reason overrides it.
 */
export function computeRisk(
  status: string,
  deadlines: Pick<ProjectDeadlineRow, "name" | "due_date" | "status">[],
  docReqs: Pick<ProjectDocumentRequirementRow, "name" | "required" | "status">[],
  from: Date = new Date()
): RiskAssessment {
  const active = deadlines.filter((d) => d.status !== "completed");
  const overdue = active.find((d) => {
    const days = daysRemaining(d.due_date, from);
    return days !== null && days < 0;
  });
  const dueSoon = active.find((d) => {
    const days = daysRemaining(d.due_date, from);
    return days !== null && days >= 0 && days <= 7;
  });
  const dueMedium = active.find((d) => {
    const days = daysRemaining(d.due_date, from);
    return days !== null && days > 7 && days <= 14;
  });
  const missingRequired = docReqs.find((d) => d.required && d.status === "missing");
  const submittedish = ["submitted", "waiting_on_authority", "approved"].includes(status);

  if (overdue) return { level: "critical", reason: `Deadline overdue: ${overdue.name}.` };
  if (submittedish && missingRequired) {
    return { level: "critical", reason: `Required document missing for a submitted stage: ${missingRequired.name}.` };
  }
  if (dueSoon) return { level: "high", reason: `Deadline due within 7 days: ${dueSoon.name}.` };
  if (missingRequired) return { level: "high", reason: `Missing required document: ${missingRequired.name}.` };
  if (status === "waiting_on_client") return { level: "medium", reason: "Waiting on client information." };
  if (dueMedium) return { level: "medium", reason: `Deadline due within 14 days: ${dueMedium.name}.` };
  return { level: "low", reason: "No major issue." };
}
