import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  MessageSquare,
  PenLine,
} from "lucide-react";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAllReviews,
  fetchReviewers,
  fetchReviewsFor,
  type ReviewQueueRow,
  type ReviewStatus,
} from "./actions";
import { SendForReviewDialog } from "./send-for-review-dialog";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Waiting for you",
  changes_requested: "Changes requested",
  approved: "Approved",
};

function StatusBadge({ status }: { status: ReviewStatus }) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
        <CheckCircle2 className="mr-1 size-3" />
        Approved
      </Badge>
    );
  }
  if (status === "changes_requested") {
    return <Badge variant="destructive">Changes requested</Badge>;
  }
  return <Badge variant="secondary">Waiting</Badge>;
}

/**
 * One review, as a large card rather than a table row.
 *
 * Deliberately roomy: the primary reader of this page is an EAP working late
 * on a laptop, and a dense grid of small links is exactly the thing that makes
 * a document get missed.
 */
function ReviewCard({
  review,
  showReviewer,
}: {
  review: ReviewQueueRow;
  showReviewer?: boolean;
}) {
  const doc = review.document;
  if (!doc) return null;

  const waiting = review.status === "pending";

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={review.status} />
            {review.open_comments > 0 && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="size-3" />
                {review.open_comments} open
              </Badge>
            )}
            {doc.version > review.document_version && (
              <Badge
                variant="outline"
                className="border-amber-500/50 text-amber-700 dark:text-amber-400"
              >
                Newer version exists (v{doc.version})
              </Badge>
            )}
          </div>

          <p className="text-base font-medium leading-snug">{doc.name}</p>

          <p className="text-sm text-muted-foreground">
            {doc.project ? (
              <Link
                to={`/projects/${doc.project.id}`}
                className="hover:underline"
              >
                {doc.project.name}
              </Link>
            ) : (
              "No project"
            )}
            {" · "}Version {review.document_version}
            {showReviewer && review.reviewer && (
              <> · {review.reviewer.full_name || review.reviewer.email}</>
            )}
          </p>

          <p className="text-xs text-muted-foreground">
            {waiting
              ? `Sent ${formatDistanceToNow(new Date(review.assigned_at), {
                  addSuffix: true,
                })}`
              : review.completed_at
                ? `${STATUS_LABEL[review.status]} on ${format(
                    new Date(review.completed_at),
                    "d MMMM yyyy"
                  )}`
                : STATUS_LABEL[review.status]}
          </p>
        </div>

        <Button asChild size="lg" variant={waiting ? "default" : "outline"}>
          <Link to={`/reviews/${review.id}`}>
            <PenLine />
            {waiting ? "Open and review" : "View"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewList({
  reviews,
  isPending,
  emptyTitle,
  emptyDescription,
  showReviewer,
}: {
  reviews: ReviewQueueRow[];
  isPending: boolean;
  emptyTitle: string;
  emptyDescription: string;
  showReviewer?: boolean;
}) {
  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const batches = groupIntoBatches(reviews);

  // One send, one heading. A single loose review needs no ceremony around it.
  if (batches.length === 1 && !batches[0].id) {
    return (
      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} showReviewer={showReviewer} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => (
        <BatchGroup
          key={batch.id ?? "loose"}
          batch={batch}
          showReviewer={showReviewer}
        />
      ))}
    </div>
  );
}

type Batch = {
  id: string | null;
  note: string | null;
  sentAt: string | null;
  reviews: ReviewQueueRow[];
};

/**
 * Reviews gathered into the sends they arrived in, newest send first.
 *
 * Anything without a batch — assigned one at a time, or before batches existed
 * — falls into a single trailing group so nothing is ever dropped from the
 * queue just because it predates the grouping.
 */
function groupIntoBatches(reviews: ReviewQueueRow[]): Batch[] {
  const byBatch = new Map<string, Batch>();
  const loose: ReviewQueueRow[] = [];

  for (const r of reviews) {
    if (!r.batch) {
      loose.push(r);
      continue;
    }
    const existing = byBatch.get(r.batch.id);
    if (existing) existing.reviews.push(r);
    else
      byBatch.set(r.batch.id, {
        id: r.batch.id,
        note: r.batch.note,
        sentAt: r.batch.created_at,
        reviews: [r],
      });
  }

  const batches = [...byBatch.values()].sort((a, b) =>
    (b.sentAt ?? "").localeCompare(a.sentAt ?? "")
  );
  if (loose.length > 0) {
    batches.push({ id: null, note: null, sentAt: null, reviews: loose });
  }
  return batches;
}

/**
 * One send, collapsed to a single row until you open it.
 *
 * A batch of sixteen studies is one thing the reviewer was asked to do. Listing
 * all sixteen at once reads as a backlog; showing the send, with how much of it
 * is left, reads as the job it actually is.
 */
function BatchGroup({
  batch,
  showReviewer,
}: {
  batch: Batch;
  showReviewer?: boolean;
}) {
  const waiting = batch.reviews.filter((r) => r.status === "pending").length;
  const done = batch.reviews.length - waiting;
  // A big send stays folded — seeing seventeen rows at once is what made the
  // queue read as a backlog. A small one opens, because collapsing three
  // documents behind a click buys nothing.
  const [open, setOpen] = useState(batch.reviews.length <= 3);

  const project = batch.reviews[0]?.document?.project?.name;

  return (
    <div className="overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/70"
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {batch.note ??
              (batch.id
                ? `${batch.reviews.length} documents`
                : "Sent individually")}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {project ? `${project} · ` : ""}
            {batch.reviews.length} document
            {batch.reviews.length === 1 ? "" : "s"}
            {batch.sentAt
              ? ` · sent ${format(new Date(batch.sentAt), "d MMM yyyy")}`
              : ""}
          </p>
        </div>
        {waiting > 0 ? (
          <Badge variant="secondary" className="shrink-0">
            {waiting} to read
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 gap-1">
            <Check className="size-3" />
            Done
          </Badge>
        )}
        {done > 0 && waiting > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {done} done
          </span>
        )}
      </button>

      {open && (
        <div className="space-y-3 p-3">
          {batch.reviews.map((r) => (
            <ReviewCard key={r.id} review={r} showReviewer={showReviewer} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  useDocumentTitle("Reviews");
  const profileQuery = useProfile();
  const [tab, setTab] = useState("mine");
  const me = profileQuery.data;

  /*
    Whose queue is on screen. Defaults to your own, and the only way to change
    it is deliberately, from the picker.

    This exists so a reviewer's view can be checked WITHOUT signing in as them.
    Borrowing someone's magic link to see their screen means every comment,
    decision and audit entry from that session is recorded as them — on a file
    whose whole value is being an honest record of who reviewed what, that is
    the one thing not to do.
  */
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = viewingId ?? me?.id ?? null;
  const isSelf = !viewingId || viewingId === me?.id;

  const reviewers = useQuery({
    queryKey: ["reviewers"],
    queryFn: fetchReviewers,
    enabled: !!me,
  });
  const viewingPerson = reviewers.data?.find((r) => r.id === viewing);

  const mine = useQuery({
    queryKey: ["reviews", "for", viewing],
    queryFn: () => fetchReviewsFor(viewing!),
    enabled: !!viewing,
  });

  const all = useQuery({
    queryKey: ["reviews", "all"],
    queryFn: fetchAllReviews,
    enabled: tab === "all",
  });

  const myPending = (mine.data ?? []).filter((r) => r.status === "pending");
  const myDone = (mine.data ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={
          isSelf
            ? "Documents sent to you to read, comment on and sign off."
            : `Showing ${viewingPerson?.full_name ?? "another reviewer"}'s queue exactly as they see it.`
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={viewing ?? ""}
            onValueChange={(v) => setViewingId(v)}
          >
            <SelectTrigger className="w-auto min-w-52 gap-2">
              <Eye className="size-4 text-muted-foreground" />
              <SelectValue placeholder="Viewing as…" />
            </SelectTrigger>
            <SelectContent>
              {(reviewers.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.id === me?.id ? "My queue" : r.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SendForReviewDialog
            onSent={() => {
              void mine.refetch();
              void all.refetch();
            }}
          />
        </div>
      </PageHeader>

      {/*
        Impossible to forget you are looking at someone else's screen — which is
        what makes it safe to comment from here. Anything you write is still
        written as you.
      */}
      {!isSelf && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <Eye className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span className="flex-1">
            Viewing <strong>{viewingPerson?.full_name}</strong>&rsquo;s queue.
            This is their live view, not a copy. Anything you write here is
            recorded as you, not as them.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewingId(me?.id ?? null)}
          >
            Back to my queue
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="mine" className="gap-2">
            <FileText className="size-4" />
            {isSelf ? "For me" : "For them"}
            {myPending.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {myPending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Everyone</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {isSelf ? "Waiting for you" : "Waiting for them"}
            </h2>
            <ReviewList
              reviews={myPending}
              isPending={mine.isPending}
              emptyTitle="Nothing waiting"
              emptyDescription={
                isSelf
                  ? "When a document is sent to you for review it will appear here."
                  : "Nothing has been sent to them, or they have finished everything."
              }
            />
          </section>

          {myDone.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Already done
              </h2>
              <ReviewList
                reviews={myDone}
                isPending={false}
                emptyTitle=""
                emptyDescription=""
              />
            </section>
          )}
        </TabsContent>

        <TabsContent value="all">
          <ReviewList
            reviews={all.data ?? []}
            isPending={all.isPending}
            showReviewer
            emptyTitle="No reviews yet"
            emptyDescription="Send a document for review from the project's Files tab."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
