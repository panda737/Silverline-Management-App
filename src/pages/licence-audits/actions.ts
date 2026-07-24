import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";
import type {
  LicenceAuditRow,
  LicenceChecklistSection,
  LicenceItemStatus,
} from "@/lib/licence-audit";

/**
 * Plain async actions for the Licence Audit module. Pre-checks are UX only —
 * RLS (internal-only) and the edge functions' own caller checks enforce.
 */

export async function createLicenceAudit(
  file: File
): Promise<{ id?: string; error?: string }> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return { error: "Internal users only." };
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Only PDF files are supported." };
  }
  if (file.size > 30 * 1024 * 1024) {
    return { error: "PDF is larger than 30 MB — please compress it first." };
  }

  const id = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\- ()]/g, "_");
  const storagePath = `${id}/${safeName}`;

  const { error: insertError } = await supabase.from("licence_audits").insert({
    id,
    created_by: profile.id,
    file_name: file.name,
    storage_path: storagePath,
    processing_status: "uploaded",
  });
  if (insertError) {
    return { error: `Could not create the audit: ${insertError.message}` };
  }

  const { error: uploadError } = await supabase.storage
    .from("licence-pdfs")
    .upload(storagePath, file, { upsert: true, contentType: "application/pdf" });
  if (uploadError) {
    await supabase.from("licence_audits").delete().eq("id", id);
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const startError = await startLicenceReview(id);
  if (startError) {
    // Row + file exist; the detail page offers a retry.
    await supabase
      .from("licence_audits")
      .update({ processing_status: "error", error_message: startError })
      .eq("id", id);
  }

  await queryClient.invalidateQueries({ queryKey: ["licence-audits"] });
  return { id };
}

/** Kick (or re-kick) the AI pipeline. Returns an error message or null. */
export async function startLicenceReview(auditId: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("licence-review", {
    body: { audit_id: auditId },
  });
  if (error) {
    return `Could not start the AI review: ${error.message}`;
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    return String(data.error);
  }
  await queryClient.invalidateQueries({ queryKey: ["licence-audit", auditId] });
  return null;
}

export async function updateLicenceAudit(
  auditId: string,
  patch: Partial<
    Pick<
      LicenceAuditRow,
      | "client_id"
      | "auditor_name"
      | "audit_date"
      | "exec_summary"
      | "audit_status"
    >
  >
): Promise<string | null> {
  const { error } = await supabase
    .from("licence_audits")
    .update(patch)
    .eq("id", auditId);
  if (error) return error.message;
  await queryClient.invalidateQueries({ queryKey: ["licence-audits"] });
  return null;
}

export async function saveLicenceSections(
  auditId: string,
  sections: LicenceChecklistSection[]
): Promise<string | null> {
  const { error } = await supabase
    .from("licence_audits")
    .update({ sections })
    .eq("id", auditId);
  if (error) return error.message;
  return null;
}

export async function deleteLicenceAudit(
  audit: Pick<LicenceAuditRow, "id" | "storage_path">
): Promise<string | null> {
  if (audit.storage_path) {
    await supabase.storage.from("licence-pdfs").remove([audit.storage_path]);
  }
  const { error } = await supabase
    .from("licence_audits")
    .delete()
    .eq("id", audit.id);
  if (error) return error.message;
  await queryClient.invalidateQueries({ queryKey: ["licence-audits"] });
  return null;
}

export async function getLicencePdfUrl(
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("licence-pdfs")
    .createSignedUrl(storagePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function generateCorrectiveAction(input: {
  requirement: string;
  ref: string;
  observation: string;
  status: LicenceItemStatus;
}): Promise<
  | { corrective_action: string; priority: "high" | "medium" | "low"; timeframe: string }
  | { error: string }
> {
  const { data, error } = await supabase.functions.invoke(
    "licence-audit-assist",
    { body: { action: "corrective_action", ...input } }
  );
  if (error) return { error: error.message };
  if (data?.error) return { error: String(data.error) };
  return data;
}

export async function generateExecSummary(
  findings: unknown
): Promise<{ summary: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke(
    "licence-audit-assist",
    { body: { action: "exec_summary", findings } }
  );
  if (error) return { error: error.message };
  if (data?.error) return { error: String(data.error) };
  return data;
}
