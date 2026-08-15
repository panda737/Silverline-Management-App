import { supabase } from "@/lib/supabase";
import type { PortalDocumentRow } from "@/lib/database.types";

/**
 * Short-lived signed URL for a document the client is allowed to see.
 *
 * Reads nothing itself — the `portal_documents` view has already restricted the
 * row set to `client_visible = true` for the signed-in client's own company, so
 * a path reaching here is one the client is entitled to. The link expires in
 * five minutes, which matches the staff side.
 */
export async function getPortalDocumentUrl(
  doc: Pick<PortalDocumentRow, "storage_path" | "name">,
  download = true
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(doc.storage_path, 300, download ? { download: doc.name } : {});
  if (error || !data) return { error: error?.message ?? "Could not create a link for that file." };
  return { url: data.signedUrl };
}
