import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  Loader2,
  MessageSquarePlus,
  Replace,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  renderDocument,
  isRenderable,
  extensionOf,
  type DocumentSection,
} from "@/lib/document-sections";
import {
  readSelection,
  resolveAnchor,
  highlightRange,
  blockFor,
  readBlock,
  plainTextOf,
  BLOCK_SELECTOR,
  SLOT_ATTR,
  type TextSelection,
} from "@/lib/text-anchor";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  fetchReview,
  fetchDocumentComments,
  addComment,
  setCommentResolved,
  submitDecision,
  reopenReview,
  getSignedUrl,
  uploadAnnotatedCopy,
  type DocumentCommentRow,
} from "./actions";

/**
 * Comment composer.
 *
 * When opened from a text selection it shows the quoted words and offers a
 * replacement field, so "strike this, it should say that" is one action rather
 * than a note describing an edit someone else then has to interpret.
 */
function CommentComposer({
  onSubmit,
  onCancel,
  placeholder,
  quote,
}: {
  onSubmit: (body: string, suggestedText: string | null) => Promise<void>;
  onCancel: () => void;
  placeholder: string;
  quote?: string | null;
}) {
  const [body, setBody] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [saving, setSaving] = useState(false);

  // A suggestion carries its meaning in the replacement wording, so it can be
  // saved without a note; a plain comment cannot.
  const canSave = suggesting
    ? suggestion.trim().length > 0
    : body.trim().length > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSubmit(body, suggesting ? suggestion : null);
    setSaving(false);
    setBody("");
    setSuggestion("");
    setSuggesting(false);
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      {/*
        Only while replacing wording — then seeing exactly what is being struck
        out matters. Otherwise the highlighted passage sits immediately above,
        and quoting it back would be the same words twice.
      */}
      {quote && suggesting && (
        <p className="border-l-2 border-destructive/40 pl-2 text-xs italic text-muted-foreground line-through">
          “{quote.length > 180 ? `${quote.slice(0, 180)}…` : quote}”
        </p>
      )}

      {suggesting && (
        <Textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="What it should say instead…"
          rows={3}
          autoFocus
          className="border-emerald-600/40 text-base"
        />
      )}

      {/*
        Two rows on a phone, four on a desktop. With the keyboard up there are
        only about 470 vertical pixels to work with, and a tall box spends them
        on emptiness — pushing Save down behind the keyboard. The field still
        grows as you type; it just does not start large.

        text-base is not decoration: below 16px, iOS zooms the whole page when
        the field takes focus, and the reader then has to pinch back out.
      */}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={suggesting ? "Why? (optional)" : placeholder}
        rows={suggesting ? 2 : 3}
        autoFocus={!suggesting}
        className="min-h-16 text-base sm:min-h-24"
      />

      <div
        data-composer-actions
        className="flex flex-wrap items-center gap-2"
      >
        <Button onClick={save} disabled={saving || !canSave}>
          {saving && <Loader2 className="animate-spin" />}
          {suggesting ? "Save change" : "Save comment"}
        </Button>
        {quote && (
          <Button
            variant="outline"
            onClick={() => setSuggesting((v) => !v)}
            disabled={saving}
          >
            <Replace />
            <span className="max-sm:sr-only">
              {suggesting ? "Just comment" : "Suggest wording"}
            </span>
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CommentThread({
  comments,
  documentId,
  onChanged,
}: {
  comments: DocumentCommentRow[];
  documentId: string;
  onChanged: () => void;
}) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div
          key={c.id}
          className={`rounded-lg border p-3 text-sm ${
            c.resolved ? "bg-muted/40 opacity-70" : "bg-card"
          }`}
        >
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {c.author?.full_name ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(c.created_at), "d MMM yyyy, HH:mm")}
            </span>
            {c.resolved && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Check className="size-3" />
                Resolved
              </Badge>
            )}
          </div>
          {/*
            A suggestion shows the original struck through above the
            replacement, so "this should say that" is legible at a glance.

            A plain comment does not repeat the quote at all: the card sits
            directly under the passage and the passage is highlighted, so
            quoting it back would just be the same words twice.
          */}
          {c.quote && c.suggested_text && (
            <p className="mb-2 border-l-2 border-destructive/40 pl-2 text-xs italic text-muted-foreground line-through">
              “{c.quote.length > 180 ? `${c.quote.slice(0, 180)}…` : c.quote}”
            </p>
          )}
          {c.suggested_text && (
            <p className="mb-2 rounded border border-emerald-600/30 bg-emerald-50 px-2 py-1 text-sm dark:bg-emerald-950/30">
              <span className="mr-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Should read:
              </span>
              {c.suggested_text}
            </p>
          )}
          {c.body && (
            <p className="whitespace-pre-wrap leading-relaxed">{c.body}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs"
            onClick={async () => {
              const err = await setCommentResolved({
                commentId: c.id,
                documentId,
                resolved: !c.resolved,
              });
              if (err) toast.error(err);
              else onChanged();
            }}
          >
            {c.resolved ? "Reopen" : "Mark resolved"}
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * Offset key for the not-yet-saved comment. Namespaced so it can never collide
 * with a comment's uuid.
 */
const PENDING_ID = "__pending__";

/** A card position in the document flow: where it renders, and what goes in it. */
type CommentSlot = {
  key: string;
  el: HTMLElement;
  ids: string[];
  pending: boolean;
};

/**
 * Insert a card slot into the document flow immediately after `block`.
 *
 * A table row cannot be followed by a <div> — the browser hoists it out of the
 * table and the card lands somewhere else entirely — so a row gets a full-width
 * row of its own instead.
 */
/**
 * Strip the previous pass's decorations without rebuilding the document.
 *
 * The obvious way to get back to clean text is `innerHTML = section.html`. It is
 * also unusable: replacing the whole document collapses its height, the browser
 * clamps the scroll position, and the paragraph the reviewer just tapped leaps
 * hundreds of pixels out from under their finger. On a phone that is the
 * difference between a usable tool and an unusable one.
 *
 * So marks are unwrapped and slots removed in place, and the surrounding text
 * nodes are re-joined so character offsets still line up with the original.
 */
function undecorate(prose: HTMLElement) {
  prose
    .querySelectorAll(`[${SLOT_ATTR}]`)
    .forEach((el) => el.parentNode?.removeChild(el));

  prose.querySelectorAll("mark[data-comment-id]").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    // Splitting left several adjacent text nodes; merge them again or the next
    // pass measures a different shape of the same text.
    (parent as HTMLElement).normalize?.();
  });

  prose
    .querySelectorAll(".doc-block-commented")
    .forEach((el) => el.classList.remove("doc-block-commented"));
}

function insertSlotAfter(block: HTMLElement): HTMLElement {
  const slot = document.createElement("div");
  slot.setAttribute(SLOT_ATTR, "");

  if (block.tagName === "TR") {
    const row = document.createElement("tr");
    row.setAttribute(SLOT_ATTR, "");
    const cell = document.createElement("td");
    cell.colSpan = block.children.length || 1;
    cell.className = "p-0";
    cell.appendChild(slot);
    row.appendChild(cell);
    block.after(row);
  } else {
    block.after(slot);
  }
  return slot;
}

/**
 * One heading-delimited slice of the document.
 *
 * A comment belongs to a BLOCK — a paragraph, a heading, a table row — and is
 * rendered directly beneath it, sharing its highlight, so the remark and the
 * text it is about read as one thing. Pointing at a block cannot miss the way
 * drag-selecting a phrase can, which matters more here than precision: a
 * reviewer marking up a hundred-page report should never have to aim.
 *
 * Selecting exact words still works and pins the comment to just those words.
 */
function SectionBlock({
  section,
  comments,
  documentId,
  reviewId,
  onChanged,
  pending,
  onStartComment,
  onCancelComment,
}: {
  section: DocumentSection;
  comments: DocumentCommentRow[];
  documentId: string;
  reviewId: string | null;
  onChanged: () => void;
  pending: TextSelection | null;
  onStartComment: (sel: TextSelection | null) => void;
  onCancelComment: () => void;
}) {
  const proseRef = useRef<HTMLDivElement>(null);
  // What HTML is currently written into the prose node. Guards the one
  // operation that must not happen on every keystroke — see paint().
  const renderedHtml = useRef<string | null>(null);
  // One entry per block that carries comments: the DOM node its cards render
  // into, and which comments belong there.
  const [slots, setSlots] = useState<CommentSlot[]>([]);
  // Comments whose quote can no longer be found in the text — they have to go
  // somewhere, and silently dropping a reviewer's remark is not an option.
  const [orphans, setOrphans] = useState<string[]>([]);
  const open = comments.filter((c) => !c.resolved).length;
  const composingHere = pending?.sectionKey === section.key;
  const byId = useMemo(
    () => new Map(comments.map((c) => [c.id, c])),
    [comments]
  );

  // The block under the pointer. Held as a ref for the DOM class and as state
  // for the button, because the highlight has to survive re-renders that the
  // pointer did not cause.
  const hoverEl = useRef<HTMLElement | null>(null);
  const [hovered, setHovered] = useState<TextSelection | null>(null);

  const setHoverBlock = useCallback((el: HTMLElement | null) => {
    if (hoverEl.current === el) return;
    hoverEl.current?.classList.remove("doc-block-hover");
    hoverEl.current = el;
    el?.classList.add("doc-block-hover");
    setHovered(el ? readBlock(el) : null);
  }, []);

  /**
   * Rebuild the section: clean text, highlights over every commented passage,
   * and a card slot under each block that carries one.
   */
  const paint = useCallback(() => {
    const prose = proseRef.current;
    if (!prose) return;

    hoverEl.current = null;

    // Write the document out ONLY when it is actually different. Every other
    // pass — a comment saved, a composer opened, a tap — reuses the DOM that is
    // already on screen and just strips last pass's decorations, so the page
    // does not move under the reader.
    if (renderedHtml.current !== section.html) {
      prose.innerHTML = section.html;
      renderedHtml.current = section.html;
      // Mark every block as a target so the cursor says it is clickable before
      // you find out by clicking.
      prose
        .querySelectorAll<HTMLElement>(BLOCK_SELECTOR)
        .forEach((el) => el.setAttribute("data-block", ""));
    } else {
      undecorate(prose);
    }

    // Measured once, before any card exists, so offsets describe the document
    // and nothing else.
    const plain = plainTextOf(prose);

    /** Highlight one anchor and report the block it landed in. */
    const mark = (
      id: string,
      quote: string,
      quoteStart: number | null,
      className: string
    ): HTMLElement | null => {
      const at = resolveAnchor(plain, quote, quoteStart);
      if (!at) return null;
      const marks = highlightRange(prose, at.start, at.end, {
        "data-comment-id": id,
        class: className,
      });
      return marks[0] ? blockFor(prose, marks[0]) : null;
    };

    // Comments grouped by the block they land in, in document order. A block
    // with three remarks gets one slot holding all three rather than three
    // slots fighting for the same gap.
    const groups = new Map<HTMLElement, string[]>();
    const lost: string[] = [];

    for (const c of comments) {
      if (!c.quote) {
        lost.push(c.id);
        continue;
      }
      const block = mark(
        c.id,
        c.quote,
        c.quote_start,
        c.resolved
          ? "rounded bg-muted px-0.5 text-muted-foreground"
          : c.suggested_text
            ? "rounded bg-emerald-200/70 px-0.5 dark:bg-emerald-900/50"
            : "rounded bg-amber-200/70 px-0.5 dark:bg-amber-900/50"
      );
      if (!block) {
        lost.push(c.id);
        continue;
      }
      groups.set(block, [...(groups.get(block) ?? []), c.id]);
    }

    // The passage being commented on right now. The browser drops the real
    // selection the moment focus moves into the textarea, so without this the
    // reviewer would be typing about words they can no longer see marked.
    let pendingBlock: HTMLElement | null = null;
    if (composingHere && pending?.quote) {
      pendingBlock = mark(
        PENDING_ID,
        pending.quote,
        pending.quoteStart,
        "rounded bg-primary/20 px-0.5 ring-1 ring-primary/40"
      );
      if (pendingBlock && !groups.has(pendingBlock)) groups.set(pendingBlock, []);
    }

    const next: CommentSlot[] = [];
    for (const [block, ids] of groups) {
      // Keep the block lit while its comments are attached, so the card below
      // reads as part of the same object rather than as a loose note.
      block.classList.add("doc-block-commented");
      next.push({
        key: ids[0] ?? PENDING_ID,
        el: insertSlotAfter(block),
        ids,
        pending: block === pendingBlock,
      });
    }

    setSlots(next);
    setOrphans(lost);
  }, [section.html, comments, composingHere, pending]);

  useLayoutEffect(() => {
    paint();
  }, [paint]);

  /*
    Bring the composer into view when it opens.

    On a phone the textarea autofocuses, the keyboard comes up, and it covers
    roughly the bottom 40% of the screen — so a composer that opened in the
    lower half is behind it, Save included. visualViewport reports the area the
    keyboard has NOT taken; where it is unavailable, the window height is the
    same number.

    Deliberately not `scrollIntoView({block:'center'})`: for a comment on a
    paragraph, centring the card pushes the paragraph it is about off the top of
    the screen, and the whole point is to see them together.
  */
  const pendingSlotKey = composingHere ? (pending?.quote ?? "section") : null;
  useEffect(() => {
    if (!pendingSlotKey) return;
    const prose = proseRef.current;
    const slot = prose?.querySelector<HTMLElement>(`[${SLOT_ATTR}]`);
    if (!prose || !slot) return;

    const id = window.setTimeout(() => {
      const block = slot.previousElementSibling ?? slot;
      const blockTop = block.getBoundingClientRect().top;
      const cardBottom = slot.getBoundingClientRect().bottom;
      const visible = window.visualViewport?.height ?? window.innerHeight;
      const margin = 16;
      const rest = 72;

      // The passage scrolled off the top — bring it back and stop.
      if (blockTop < 8) {
        window.scrollBy({ top: blockTop - rest, behavior: "smooth" });
        return;
      }

      // Everything already fits. Do nothing: on a laptop the card almost always
      // fits under its paragraph, and scrolling anyway is its own kind of jump.
      const overflow = cardBottom - (visible - margin);
      if (overflow <= 0) return;

      // Scroll just enough to reveal the card — and never so far that the
      // passage it belongs to is pushed off the top, because seeing the two
      // together is the whole point.
      const headroom = Math.max(blockTop - rest, 0);
      window.scrollBy({ top: Math.min(overflow, headroom), behavior: "smooth" });
    }, 50);

    /*
      Then hand the rest to the keyboard.

      A long paragraph plus a comment box does not fit in the ~470px a phone
      leaves above an open keyboard, so preferring the passage — right until the
      moment the reviewer starts typing — is the correct trade. Once the
      keyboard is actually up they are writing, not reading, and Save has to be
      reachable. visualViewport resizes when the keyboard opens; nothing else
      tells us it happened.
    */
    const vv = window.visualViewport;
    const keepActionsReachable = () => {
      const visible = vv?.height ?? window.innerHeight;
      const actions =
        slot.querySelector<HTMLElement>("[data-composer-actions]") ?? slot;
      const rect = actions.getBoundingClientRect();
      const margin = 12;
      if (rect.bottom <= visible - margin) return;
      window.scrollBy({ top: rect.bottom - (visible - margin), behavior: "smooth" });
    };
    vv?.addEventListener("resize", keepActionsReachable);

    return () => {
      window.clearTimeout(id);
      vv?.removeEventListener("resize", keepActionsReachable);
    };
  }, [pendingSlotKey]);

  return (
    <section
      className="group scroll-mt-24"
      id={`section-${section.key}`}
      data-section-key={section.key}
      data-section-title={section.title}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2
          className={`font-semibold tracking-tight ${
            section.level === 1 ? "text-xl" : "text-lg"
          }`}
        >
          {section.title}
        </h2>
        <div className="flex items-center gap-2">
          {open > 0 && (
            <Badge variant="secondary">
              {open} comment{open === 1 ? "" : "s"}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartComment(null)}
          >
            <MessageSquarePlus />
            Comment on section
          </Button>
        </div>
      </div>

      {/*
        Hover a paragraph, a heading or a table row and it lifts; click it and
        the comment opens directly underneath, attached to it.
      */}
      <div className="relative mt-3">
        <div
          className="doc-prose-scroll"
          onMouseOver={(e) => {
            const prose = proseRef.current;
            if (!prose) return;
            setHoverBlock(blockFor(prose, e.target as Node));
          }}
          onMouseLeave={() => setHoverBlock(null)}
          onClick={(e) => {
            const prose = proseRef.current;
            if (!prose) return;
            // A click that ends a drag belongs to the selection flow, a click
            // on a link belongs to the link, and a click inside a card that is
            // already open belongs to the card.
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) return;
            const target = e.target as HTMLElement;
            if (target.closest("a")) return;

            const block = blockFor(prose, target);
            if (!block) return;
            const anchor = readBlock(block);
            if (anchor) onStartComment(anchor);
          }}
        >
          <div ref={proseRef} data-prose className="doc-prose" />
        </div>

        {/*
          Cards render into slots the paint pass put in the document flow, so
          each one sits immediately below the block it is about.
        */}
        {slots.map((slot) =>
          createPortal(
            <div className="doc-comment-card">
              <CommentThread
                comments={slot.ids
                  .map((cid) => byId.get(cid))
                  .filter((c): c is DocumentCommentRow => !!c)}
                documentId={documentId}
                onChanged={onChanged}
              />
              {slot.pending && pending && (
                <CommentComposer
                  quote={pending.quote}
                  placeholder="Your comment on this…"
                  onCancel={onCancelComment}
                  onSubmit={async (body, suggestedText) => {
                    const err = await addComment({
                      documentId,
                      reviewId,
                      sectionKey: pending.sectionKey,
                      sectionTitle: pending.sectionTitle,
                      body,
                      quote: pending.quote,
                      quoteStart: pending.quoteStart,
                      suggestedText,
                    });
                    if (err) return void toast.error(err);
                    toast.success(
                      suggestedText ? "Change suggested" : "Comment saved"
                    );
                    onCancelComment();
                    onChanged();
                  }}
                />
              )}
            </div>,
            slot.el,
            slot.key
          )
        )}

        {hovered && !composingHere && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-0 z-10 shadow-sm"
            style={{ top: `${hovered.railTop}px` }}
            onClick={() => onStartComment(hovered)}
          >
            <MessageSquarePlus />
            Comment
          </Button>
        )}
      </div>

      {/*
        Remarks about the section as a whole, and any whose text has since
        changed so much that it can no longer be found. Below the prose because
        they are about all of it, not about one place in it.
      */}
      {(composingHere && !pending?.quote) || orphans.length > 0 ? (
        <div className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">
          {composingHere && !pending?.quote && (
            <CommentComposer
              placeholder={`Your comment on "${section.title}"…`}
              onCancel={onCancelComment}
              onSubmit={async (body) => {
                const err = await addComment({
                  documentId,
                  reviewId,
                  sectionKey: section.key,
                  sectionTitle: section.title,
                  body,
                });
                if (err) return void toast.error(err);
                toast.success("Comment saved");
                onCancelComment();
                onChanged();
              }}
            />
          )}
          <CommentThread
            comments={orphans
              .map((cid) => byId.get(cid))
              .filter((c): c is DocumentCommentRow => !!c)}
            documentId={documentId}
            onChanged={onChanged}
          />
        </div>
      ) : null}

      <Separator className="mt-8" />
    </section>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const profileQuery = useProfile();
  const fileInput = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  // A live selection offering the floating button, and the one the reviewer
  // committed to by clicking it. Kept apart so the composer survives the
  // browser clearing the selection the moment focus moves into the textarea.
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [pending, setPending] = useState<TextSelection | null>(null);

  // Selection is a document-level event; there is no React onSelect that fires
  // reliably for drag, double-click and keyboard selection alike.
  useEffect(() => {
    const onSelectionChange = () => {
      const root = docRef.current;
      if (!root) return;
      setSelection(readSelection(root));
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const reviewQuery = useQuery({
    queryKey: ["review", id],
    queryFn: () => fetchReview(id!),
    enabled: !!id,
  });
  const review = reviewQuery.data;
  const doc = review?.document ?? null;

  useDocumentTitle(doc?.name ?? "Review");

  const commentsQuery = useQuery({
    queryKey: ["document-comments", doc?.id],
    queryFn: () => fetchDocumentComments(doc!.id),
    enabled: !!doc,
  });

  // Download + convert once per document. Kept in the query cache so switching
  // tabs does not re-fetch and re-parse a 40-page Word file.
  const renderQuery = useQuery({
    queryKey: ["document-render", doc?.storage_path],
    enabled: !!doc && isRenderable(doc.name),
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("project-documents")
        .download(doc!.storage_path);
      if (error || !data) throw new Error(error?.message ?? "Download failed");
      return renderDocument(data, doc!.name);
    },
  });

  const commentsBySection = useMemo(() => {
    const map = new Map<string, DocumentCommentRow[]>();
    (commentsQuery.data ?? []).forEach((c) => {
      const key = c.section_key ?? "__document__";
      map.set(key, [...(map.get(key) ?? []), c]);
    });
    return map;
  }, [commentsQuery.data]);

  const refresh = () => {
    void commentsQuery.refetch();
    void reviewQuery.refetch();
  };

  const download = async () => {
    if (!doc) return;
    const { url, error } = await getSignedUrl(doc.storage_path);
    if (error || !url) {
      toast.error(error ?? "Could not open the file.");
      return;
    }
    window.open(url, "_blank");
  };

  const decide = async (status: "approved" | "changes_requested") => {
    if (!review) return;
    setBusy(true);
    const err = await submitDecision({
      reviewId: review.id,
      status,
      note: decisionNote,
    });
    setBusy(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(
      status === "approved" ? "Approved — thank you." : "Changes requested."
    );
    setDecisionNote("");
    refresh();
  };

  if (reviewQuery.isPending) {
    return <div className="min-h-64" aria-busy="true" />;
  }
  if (!review || !doc) {
    return (
      <div className="space-y-4">
        <PageHeader title="Review not found" />
        <Button asChild variant="outline">
          <Link to="/reviews">
            <ArrowLeft />
            Back to reviews
          </Link>
        </Button>
      </div>
    );
  }

  const isMine = review.reviewer?.id === profileQuery.data?.id;
  const generalComments = commentsBySection.get("__document__") ?? [];
  const rendered = renderQuery.data;

  return (
    <div className="space-y-6 pb-32">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/reviews">
            <ArrowLeft />
            All reviews
          </Link>
        </Button>

        <PageHeader
          title={doc.name}
          description={`${doc.project?.name ?? "No project"} · Version ${review.document_version}`}
        >
          <Button variant="outline" onClick={download}>
            <Download />
            Download {extensionOf(doc.name).toUpperCase() || "file"}
          </Button>
        </PageHeader>

        {review.status !== "pending" && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
            {review.status === "approved" ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                <CheckCircle2 className="mr-1 size-3" />
                Approved
              </Badge>
            ) : (
              <Badge variant="destructive">Changes requested</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {review.reviewer?.full_name} ·{" "}
              {review.completed_at
                ? format(new Date(review.completed_at), "d MMMM yyyy, HH:mm")
                : ""}
            </span>
            {review.decision_note && (
              <p className="w-full text-sm">{review.decision_note}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const err = await reopenReview(review.id);
                if (err) toast.error(err);
                else refresh();
              }}
            >
              <Undo2 />
              Reopen
            </Button>
          </div>
        )}
      </div>

      {/* Word round-trip: the habit he already has, kept intact. */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm">
            <p className="font-medium">Prefer to comment in Word?</p>
            <p className="text-muted-foreground">
              Download the file, use Word&apos;s own comments, then send it back
              here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !doc.project) return;
                setUploading(true);
                const err = await uploadAnnotatedCopy({
                  reviewId: review.id,
                  projectId: doc.project.id,
                  file,
                });
                setUploading(false);
                e.target.value = "";
                if (err) toast.error(err);
                else {
                  toast.success("Your commented copy is saved.");
                  refresh();
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload my commented copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {review.annotated_storage_path && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>A commented copy was uploaded for this review.</span>
          <Button
            variant="link"
            size="sm"
            onClick={async () => {
              const { url, error } = await getSignedUrl(
                review.annotated_storage_path!
              );
              if (error || !url) toast.error(error ?? "Could not open.");
              else window.open(url, "_blank");
            }}
          >
            Open it
          </Button>
        </div>
      )}

      {/* General comment on the document as a whole. */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Comment on the whole document</p>
          <CommentComposer
            placeholder="A general remark about this document…"
            onCancel={() => undefined}
            onSubmit={async (body) => {
              const err = await addComment({
                documentId: doc.id,
                reviewId: review.id,
                sectionKey: null,
                sectionTitle: null,
                body,
              });
              if (err) toast.error(err);
              else {
                toast.success("Comment saved");
                refresh();
              }
            }}
          />
          <CommentThread
            comments={generalComments}
            documentId={doc.id}
            onChanged={refresh}
          />
        </CardContent>
      </Card>

      {/* The document itself. */}
      {!isRenderable(doc.name) ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This file type cannot be shown in the browser. Download it to read
              it, then leave your comments above.
            </p>
            <Button onClick={download}>
              <Download />
              Download
            </Button>
          </CardContent>
        </Card>
      ) : renderQuery.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
        </div>
      ) : renderQuery.isError || !rendered ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              The document could not be displayed here. Download it instead —
              your comments still save normally.
            </p>
            <Button onClick={download}>
              <Download />
              Download
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div ref={docRef} className="space-y-8">
          {rendered.sections.map((section) => (
            <SectionBlock
              key={section.key}
              section={section}
              comments={commentsBySection.get(section.key) ?? []}
              documentId={doc.id}
              reviewId={review.id}
              onChanged={refresh}
              pending={pending}
              onStartComment={(sel) =>
                setPending(
                  sel ?? {
                    sectionKey: section.key,
                    sectionTitle: section.title,
                    quote: "",
                    quoteStart: 0,
                    rect: new DOMRect(),
                    railTop: 0,
                  }
                )
              }
              onCancelComment={() => setPending(null)}
            />
          ))}
        </div>
      )}

      {/*
        The floating button that turns a selection into a comment. Anchored to
        the selection itself rather than parked in a toolbar: the reviewer's eye
        and cursor are already on the words, and asking them to travel to a
        toolbar is what made the old flow feel like scrolling away from the work.
      */}
      {selection && (
        <div
          className="fixed z-50 -translate-x-1/2"
          style={{
            left: selection.rect.left + selection.rect.width / 2,
            top: Math.max(8, selection.rect.top - 44),
          }}
        >
          <Button
            size="sm"
            className="shadow-lg"
            onMouseDown={(e) => {
              // Keep the selection alive: the browser clears it on mousedown
              // elsewhere, and the quote would be gone before the click landed.
              e.preventDefault();
              setPending(selection);
              setSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <MessageSquarePlus />
            Comment on this
          </Button>
        </div>
      )}

      {/* Decision bar — sticky so it is reachable from anywhere in a long report. */}
      {isMine && review.status === "pending" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
            <Textarea
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Optional note with your decision…"
              rows={1}
              className="min-h-10 flex-1 resize-none text-base"
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => decide("changes_requested")}
            >
              Request changes
            </Button>
            <Button disabled={busy} onClick={() => decide("approved")}>
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Approve
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
