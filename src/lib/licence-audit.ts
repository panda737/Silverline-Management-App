/**
 * Licence Audit module — types + helpers.
 * Mirrors supabase/migrations/20260724000001_licence_audits.sql (same pattern
 * as wml.ts: module-specific rows/enums live here, not in database.types.ts).
 */

export type LicenceProcessingStatus =
  | "uploaded"
  | "reading"
  | "extracting"
  | "ready"
  | "error";

export type LicenceItemStatus =
  | "compliant"
  | "partial"
  | "non_compliant"
  | "not_applicable";

export type LicencePriority = "high" | "medium" | "low";

export type LicenceChecklistItem = {
  id: string;
  requirement: string;
  ref: string;
  page: number;
  auditable: boolean;
  status: LicenceItemStatus | null;
  observation: string;
  correctiveAction: string;
  priority: LicencePriority | null;
  targetDate: string;
};

export type LicenceChecklistSection = {
  title: string;
  items: LicenceChecklistItem[];
};

export type LicenceMetadata = {
  licence_number?: string;
  licence_holder?: string;
  facility_name?: string;
  sector?: string;
  location?: string;
  issuing_authority?: string;
  issue_date?: string;
  review_or_expiry_date?: string;
  listed_activities?: string[];
};

export type LicenceAuditRow = {
  id: string;
  created_by: string | null;
  client_id: string | null;
  file_name: string;
  storage_path: string;
  page_count: number | null;
  processing_status: LicenceProcessingStatus;
  processing_note: string | null;
  error_message: string | null;
  doc_type: string | null;
  doc_type_label: string | null;
  doc_summary: string | null;
  metadata: LicenceMetadata;
  sections: LicenceChecklistSection[];
  audit_status: "in_progress" | "completed";
  auditor_name: string;
  audit_date: string | null;
  exec_summary: string;
  created_at: string;
  updated_at: string;
};

export const LICENCE_DOC_TYPE_LABELS: Record<string, string> = {
  waste_management_licence: "Waste Management Licence",
  norms_and_standards_registration: "Norms & Standards Registration",
  water_use_licence: "Water Use Licence",
  environmental_authorisation: "Environmental Authorisation",
  general_authorisation: "General Authorisation",
  atmospheric_emission_licence: "Atmospheric Emission Licence",
  other: "Other instrument",
};

export const ITEM_STATUS_LABELS: Record<LicenceItemStatus, string> = {
  compliant: "Compliant",
  partial: "Partially compliant",
  non_compliant: "Non-compliant",
  not_applicable: "Not applicable",
};

export const ITEM_STATUS_SHORT: Record<LicenceItemStatus, string> = {
  compliant: "C",
  partial: "PC",
  non_compliant: "NC",
  not_applicable: "N/A",
};

export const PRIORITY_LABELS: Record<LicencePriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type ComplianceStats = {
  totalAuditable: number;
  assessed: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  notApplicable: number;
  /** 0-100; compliant=1, partial=0.5, over assessed excl. N/A. Null until something is assessed. */
  score: number | null;
};

export function complianceStats(
  sections: LicenceChecklistSection[]
): ComplianceStats {
  let totalAuditable = 0;
  let compliant = 0;
  let partial = 0;
  let nonCompliant = 0;
  let notApplicable = 0;

  for (const section of sections) {
    for (const item of section.items) {
      if (!item.auditable) continue;
      totalAuditable++;
      if (item.status === "compliant") compliant++;
      else if (item.status === "partial") partial++;
      else if (item.status === "non_compliant") nonCompliant++;
      else if (item.status === "not_applicable") notApplicable++;
    }
  }

  const assessed = compliant + partial + nonCompliant + notApplicable;
  const scored = compliant + partial + nonCompliant;
  const score =
    scored > 0 ? Math.round(((compliant + partial * 0.5) / scored) * 100) : null;

  return {
    totalAuditable,
    assessed,
    compliant,
    partial,
    nonCompliant,
    notApplicable,
    score,
  };
}

/** All partially compliant + non-compliant items, flattened for the register. */
export function nonConformances(sections: LicenceChecklistSection[]) {
  return sections.flatMap((section) =>
    section.items
      .filter(
        (i) =>
          i.auditable &&
          (i.status === "non_compliant" || i.status === "partial")
      )
      .map((i) => ({ section: section.title, ...i }))
  );
}
