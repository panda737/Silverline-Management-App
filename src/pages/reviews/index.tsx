import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
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
  fetchMyReviews,
  fetchAllReviews,
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

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} showReviewer={showReviewer} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  useDocumentTitle("Reviews");
  const profileQuery = useProfile();
  const [tab, setTab] = useState("mine");

  const mine = useQuery({
    queryKey: ["reviews", "mine", profileQuery.data?.id],
    queryFn: fetchMyReviews,
    enabled: !!profileQuery.data,
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
        description="Documents sent to you to read, comment on and sign off."
      >
        <SendForReviewDialog
          onSent={() => {
            void mine.refetch();
            void all.refetch();
          }}
        />
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="mine" className="gap-2">
            <FileText className="size-4" />
            For me
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
              Waiting for you
            </h2>
            <ReviewList
              reviews={myPending}
              isPending={mine.isPending}
              emptyTitle="Nothing waiting"
              emptyDescription="When a document is sent to you for review it will appear here."
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
