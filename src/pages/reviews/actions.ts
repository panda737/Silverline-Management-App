import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";

/**
 * Document review actions.
 *
 * A review is pinned to a document VERSION: if the source document is
 * republished while a review is open, the reviewer's comments still describe
 * the text they actually read. That is why nothing here mutates a review's
 * document_version — a new version means a new review.
 */

export type ReviewStatus = "pending" | "changes_requested" | "approved";

export type ReviewQueueRow = {
  id: string;
  status: ReviewStatus;
  document_version: number;
  assigned_at: string;
  completed_at: string | null;
  decision_note: string | null;
  annotated_storage_path: string | null;
  document: {
    id: string;
    name: string;
    doc_type: string;
    version: number;
    storage_path: string;
    project: { id: string; name: string } | null;
  } | null;
  reviewer: { id: string; full_name: string; email: string } | null;
  /**
   * The send that this review arrived in. Sixteen specialist studies sent
   * together are one act of work, not sixteen — the queue groups by this so a
   * reviewer sees two things to do rather than twenty-two.
   */
  batch: { id: string; note: string | null; created_at: string } | null;
  open_comments: number;
};

const REVIEW_SELECT = `
  id, status, document_version, assigned_at, completed_at, decision_note,
  annotated_storage_path,
  document:documents ( id, name, doc_type, version, storage_path,
    project:projects ( id, name ) ),
  reviewer:profiles!document_reviews_reviewer_id_fkey ( id, full_name, email ),
  batch:review_batches ( id, note, created_at )
`;

const invalidate = async () => {
  await queryClient.invalidateQueries({ queryKey: ["reviews"] });
  await queryClient.invalidateQueries({ queryKey: ["review"] });
};

/** Reviews assigned to the signed-in user. The reviewer's own queue. */
export async function fetchMyReviews(): Promise<ReviewQueueRow[]> {
  const profile = await getActionProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from("document_reviews")
    .select(REVIEW_SELECT)
    .eq("reviewer_id", profile.id)
    .order("status", { ascending: true })
    .order("assigned_at", { ascending: false });
  if (error || !data) return [];

  return withOpenCommentCounts(data as unknown as ReviewQueueRow[]);
}

/**
 * One person's queue, exactly as they see it.
 *
 * Not a report about their queue — the same query as fetchMyReviews with a
 * different id, so what you see here cannot drift from what they see. That is
 * the whole point: checking a colleague's view by duplicating their reviews
 * onto your own account would give you a second copy that diverges the moment
 * either of you comments on anything.
 *
 * Internal users can already read every review through the "Everyone" tab, so
 * this exposes nothing new. RLS still decides.
 */
export async function fetchReviewsFor(
  reviewerId: string
): Promise<ReviewQueueRow[]> {
  const { data, error } = await supabase
    .from("document_reviews")
    .select(REVIEW_SELECT)
    .eq("reviewer_id", reviewerId)
    .order("status", { ascending: true })
    .order("assigned_at", { ascending: false });
  if (error || !data) return [];

  return withOpenCommentCounts(data as unknown as ReviewQueueRow[]);
}

/** Every review in flight — the "who is holding what" view for the team. */
export async function fetchAllReviews(): Promise<ReviewQueueRow[]> {
  const { data, error } = await supabase
    .from("document_reviews")
    .select(REVIEW_SELECT)
    .order("assigned_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];

  return withOpenCommentCounts(data as unknown as ReviewQueueRow[]);
}

/**
 * Open-comment counts in one round trip rather than N. Supabase has no cheap
 * grouped count through PostgREST, so we pull the open comment rows for the
 * documents in play and tally client-side — fine at this table's size, and it
 * keeps the queue to two queries instead of one per row.
 */
async function withOpenCommentCounts(
  rows: ReviewQueueRow[]
): Promise<ReviewQueueRow[]> {
  const reviewIds = rows.map((r) => r.id);
  if (reviewIds.length === 0) return rows;

  const { data } = await supabase
    .from("document_comments")
    .select("review_id")
    .in("review_id", reviewIds)
    .eq("resolved", false);

  const tally = new Map<string, number>();
  (data ?? []).forEach((c: { review_id: string | null }) => {
    if (c.review_id) tally.set(c.review_id, (tally.get(c.review_id) ?? 0) + 1);
  });

  return rows.map((r) => ({ ...r, open_comments: tally.get(r.id) ?? 0 }));
}

export async function fetchReview(id: string): Promise<ReviewQueueRow | null> {
  const { data, error } = await supabase
    .from("document_reviews")
    .select(REVIEW_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { ...(data as unknown as ReviewQueueRow), open_comments: 0 };
}

export type DocumentCommentRow = {
  id: string;
  section_key: string | null;
  section_title: string | null;
  body: string;
  quote: string | null;
  quote_start: number | null;
  suggested_text: string | null;
  resolved: boolean;
  created_at: string;
  author: { id: string; full_name: string } | null;
};

export async function fetchDocumentComments(
  documentId: string
): Promise<DocumentCommentRow[]> {
  const { data, error } = await supabase
    .from("document_comments")
    .select(
      `id, section_key, section_title, body, quote, quote_start, suggested_text,
       resolved, created_at,
       author:profiles!document_comments_author_id_fkey ( id, full_name )`
    )
    .eq("document_id", documentId)
    // Ordered by position in the document, then by when written, so the rail
    // reads down the page the way the reader's eye does.
    .order("quote_start", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as unknown as DocumentCommentRow[];
}

export async function addComment(input: {
  documentId: string;
  reviewId: string | null;
  sectionKey: string | null;
  sectionTitle: string | null;
  body: string;
  /** Verbatim text selected; null for a section- or document-level remark. */
  quote?: string | null;
  /** Offset of that text within the section, to disambiguate repeats. */
  quoteStart?: number | null;
  /** Proposed replacement wording. Null means a plain comment. */
  suggestedText?: string | null;
}): Promise<string | null> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return "Internal users only.";
  }
  const body = input.body.trim();
  const suggested = input.suggestedText?.trim() || null;
  // A suggestion carries its meaning in the replacement, so it may stand without
  // a note; a plain comment cannot be empty.
  if (!body && !suggested) return "Write a comment first.";
  // Mirrors the DB check constraint, but fails here with a sentence a reviewer
  // can act on rather than a Postgres violation.
  if (suggested && !input.quote) {
    return "Select the words you want to replace first.";
  }

  const { error } = await supabase.from("document_comments").insert({
    document_id: input.documentId,
    review_id: input.reviewId,
    author_id: profile.id,
    section_key: input.sectionKey,
    section_title: input.sectionTitle,
    body,
    quote: input.quote ?? null,
    quote_start: input.quoteStart ?? null,
    suggested_text: suggested,
  });
  if (error) return `Could not save the comment: ${error.message}`;

  await invalidate();
  await queryClient.invalidateQueries({
    queryKey: ["document-comments", input.documentId],
  });
  return null;
}

export async function setCommentResolved(input: {
  commentId: string;
  documentId: string;
  resolved: boolean;
}): Promise<string | null> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client") return "Internal users only.";

  const { error } = await supabase
    .from("document_comments")
    .update({
      resolved: input.resolved,
      resolved_by: input.resolved ? profile.id : null,
      resolved_at: input.resolved ? new Date().toISOString() : null,
    })
    .eq("id", input.commentId);
  if (error) return `Could not update the comment: ${error.message}`;

  await invalidate();
  await queryClient.invalidateQueries({
    queryKey: ["document-comments", input.documentId],
  });
  return null;
}

/**
 * The reviewer's decision. `completed_at` is stamped by a DB trigger so the
 * timestamp is the database's, not the browser's — it is an audit record of EAP
 * adoption, and a clock-skewed laptop should not be able to write it.
 */
export async function submitDecision(input: {
  reviewId: string;
  status: Exclude<ReviewStatus, "pending">;
  note: string;
}): Promise<string | null> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return "Internal users only.";
  }

  const { error } = await supabase
    .from("document_reviews")
    .update({
      status: input.status,
      decision_note: input.note.trim() || null,
    })
    .eq("id", input.reviewId);
  if (error) return `Could not record the decision: ${error.message}`;

  await invalidate();
  return null;
}

/** Reopen a completed review (new information, or it was decided too early). */
export async function reopenReview(reviewId: string): Promise<string | null> {
  const { error } = await supabase
    .from("document_reviews")
    .update({ status: "pending", decision_note: null })
    .eq("id", reviewId);
  if (error) return `Could not reopen: ${error.message}`;
  await invalidate();
  return null;
}

/** Signed URL for the stored file — 5 minutes, minted per click, RLS-checked. */
export async function getSignedUrl(
  storagePath: string
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(storagePath, 300);
  if (error || !data) return { error: error?.message ?? "Could not open file." };
  return { url: data.signedUrl };
}

/**
 * The Word round-trip: the reviewer downloads, comments in Word as they always
 * have, and uploads their annotated copy back. Stored alongside the review
 * rather than replacing the document — the original must stay untouched.
 */
export async function uploadAnnotatedCopy(input: {
  reviewId: string;
  projectId: string;
  file: File;
}): Promise<string | null> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return "Internal users only.";
  }
  if (input.file.size > 50 * 1024 * 1024) return "File is larger than 50 MB.";

  const safeName = input.file.name.replace(/[^\w.\- ()]/g, "_");
  const storagePath = `${input.projectId}/${crypto.randomUUID()}-annotated-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, input.file);
  if (uploadError) return `Upload failed: ${uploadError.message}`;

  const { error } = await supabase
    .from("document_reviews")
    .update({
      annotated_storage_path: storagePath,
      annotated_at: new Date().toISOString(),
    })
    .eq("id", input.reviewId);
  if (error) return `Saved the file but could not link it: ${error.message}`;

  await invalidate();
  return null;
}

/**
 * Send documents to a reviewer as ONE batch, so publishing sixteen specialist
 * studies produces one notification rather than sixteen.
 */
export async function assignForReview(input: {
  documentIds: string[];
  reviewerId: string;
  note?: string;
}): Promise<string | null> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return "Internal users only.";
  }
  if (input.documentIds.length === 0) return "Pick at least one document.";

  const { data: batch, error: batchError } = await supabase
    .from("review_batches")
    .insert({
      reviewer_id: input.reviewerId,
      created_by: profile.id,
      note: input.note?.trim() || null,
    })
    .select("id")
    .single();
  if (batchError || !batch) {
    return `Could not create the batch: ${batchError?.message}`;
  }

  const { data: docs } = await supabase
    .from("documents")
    .select("id, version")
    .in("id", input.documentIds);

  const rows = (docs ?? []).map((d: { id: string; version: number }) => ({
    document_id: d.id,
    document_version: d.version,
    reviewer_id: input.reviewerId,
    batch_id: batch.id,
    assigned_by: profile.id,
  }));

  // A document already out with this reviewer at this version is not an error —
  // re-sending it should be idempotent, not a failure.
  const { error } = await supabase
    .from("document_reviews")
    .upsert(rows, {
      onConflict: "document_id,document_version,reviewer_id",
      ignoreDuplicates: true,
    });
  if (error) return `Could not assign: ${error.message}`;

  await invalidate();
  return null;
}

/** Internal users who can be sent a review. */
export async function fetchReviewers(): Promise<
  { id: string; full_name: string; email: string }[]
> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .neq("role", "client")
    .eq("active", true)
    .order("full_name");
  return (data ?? []) as { id: string; full_name: string; email: string }[];
}
