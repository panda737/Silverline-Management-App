import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";
import type { DocType, DocumentRow } from "@/lib/database.types";

/**
 * Project file actions. Storage security model:
 *  - `project-documents` bucket is PRIVATE — nothing is ever publicly reachable.
 *  - Downloads use signed URLs valid for 5 minutes, minted per click with the
 *    caller's own session (RLS checks run on every mint).
 *  - Uploads/deletes require can_edit_project() (admin, or staff on the
 *    project); clients can only ever READ files marked client-visible.
 */

const invalidate = async (projectId: string) => {
  await queryClient.invalidateQueries({
    queryKey: ["project", projectId, "documents"],
  });
  await queryClient.invalidateQueries({
    queryKey: ["project", projectId, "folders"],
  });
  await queryClient.invalidateQueries({ queryKey: ["documents"] });
};

export async function uploadProjectDocument(input: {
  projectId: string;
  file: File;
  docType: DocType;
  clientVisible: boolean;
  folderId: string | null;
  notes?: string;
}): Promise<string | null> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return "Internal users only.";
  }
  if (input.file.size > 50 * 1024 * 1024) {
    return "File is larger than 50 MB.";
  }

  // Path convention required by the storage policies: <project_id>/<random>-<name>
  const safeName = input.file.name.replace(/[^\w.\- ()]/g, "_");
  const storagePath = `${input.projectId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, input.file);
  if (uploadError) {
    return `Upload failed: ${uploadError.message}`;
  }

  const { error: insertError } = await supabase.from("documents").insert({
    project_id: input.projectId,
    name: input.file.name,
    doc_type: input.docType,
    storage_path: storagePath,
    client_visible: input.clientVisible,
    uploaded_by: profile.id,
    folder_id: input.folderId,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  });
  if (insertError) {
    // Don't leave an orphaned object behind if the row insert was refused.
    await supabase.storage.from("project-documents").remove([storagePath]);
    return `Could not save the document record: ${insertError.message}`;
  }

  await supabase.from("activity_log").insert({
    actor_id: profile.id,
    action: "document_uploaded",
    details: { project_id: input.projectId, name: input.file.name },
  });

  await invalidate(input.projectId);
  return null;
}

/** Short-lived signed URL; `download` forces a file download with its name. */
export async function getProjectDocumentUrl(
  doc: Pick<DocumentRow, "storage_path" | "name">,
  download = true
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(doc.storage_path, 300, download ? { download: doc.name } : {});
  if (error || !data) return { error: error?.message ?? "Could not create link." };
  return { url: data.signedUrl };
}

export async function setDocumentVisibility(
  doc: Pick<DocumentRow, "id" | "project_id">,
  clientVisible: boolean
): Promise<string | null> {
  const { error } = await supabase
    .from("documents")
    .update({ client_visible: clientVisible })
    .eq("id", doc.id);
  if (error) return error.message;
  await invalidate(doc.project_id);
  return null;
}

export async function deleteProjectDocument(
  doc: Pick<DocumentRow, "id" | "project_id" | "storage_path">
): Promise<string | null> {
  const { error: rowError } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id);
  if (rowError) return rowError.message;

  // Row deletion passed RLS, so the caller may also remove the object.
  await supabase.storage.from("project-documents").remove([doc.storage_path]);
  await invalidate(doc.project_id);
  return null;
}

/** Move a file into another folder (null = unfiled). */
export async function moveDocumentToFolder(
  doc: Pick<DocumentRow, "id" | "project_id">,
  folderId: string | null
): Promise<string | null> {
  const { error } = await supabase
    .from("documents")
    .update({ folder_id: folderId })
    .eq("id", doc.id);
  if (error) return error.message;
  await invalidate(doc.project_id);
  return null;
}

// --- Folders ---------------------------------------------------------------

export async function createProjectFolder(
  projectId: string,
  name: string,
  parentId: string | null = null
): Promise<string | null> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Give the folder a name.";

  // New folders sort after their siblings (root folders after the seeded set).
  const siblings = supabase
    .from("project_folders")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const { data: last } = await (parentId
    ? siblings.eq("parent_id", parentId)
    : siblings.is("parent_id", null)
  ).maybeSingle();

  const { error } = await supabase.from("project_folders").insert({
    project_id: projectId,
    name: trimmed,
    parent_id: parentId,
    sort_order: (last?.sort_order ?? 0) + 10,
  });
  if (error) {
    return error.code === "23505"
      ? "A folder with that name already exists here."
      : error.message;
  }
  await invalidate(projectId);
  return null;
}

export async function renameProjectFolder(
  folder: { id: string; project_id: string },
  name: string
): Promise<string | null> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Give the folder a name.";
  const { error } = await supabase
    .from("project_folders")
    .update({ name: trimmed })
    .eq("id", folder.id);
  if (error) {
    return error.code === "23505"
      ? "A folder with that name already exists on this project."
      : error.message;
  }
  await invalidate(folder.project_id);
  return null;
}

/** Files in the folder are NOT deleted — they become unfiled. */
export async function deleteProjectFolder(folder: {
  id: string;
  project_id: string;
}): Promise<string | null> {
  const { error } = await supabase
    .from("project_folders")
    .delete()
    .eq("id", folder.id);
  if (error) return error.message;
  await invalidate(folder.project_id);
  return null;
}
