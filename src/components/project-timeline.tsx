import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineStatus } from "@/lib/database.types";

/**
 * Minimal shape a timeline node needs. Satisfied by both the internal
 * project_timeline_items rows and the client-facing portal_timeline_items view,
 * so staff and clients render the identical timeline.
 */
export type TimelineStageLike = {
  id: string;
  stage_name: string;
  status: TimelineStatus;
};

/** Understated node on a continuous track: filled circle + slim tick = done,
 *  ringed + breathing = current, hollow = upcoming, dashed = skipped. */
function StageNode({ status, current }: { status: TimelineStatus; current: boolean }) {
  if (status === "completed") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
        <Check className="size-3" strokeWidth={2.75} />
      </span>
    );
  }
  if (status === "skipped") {
    return <span className="size-5 rounded-full border border-dashed border-muted-foreground/40 bg-background" />;
  }
  if (current) {
    return (
      <span className="relative flex items-center justify-center">
        <span
          className="absolute inline-flex size-7 rounded-full bg-primary/15 animate-pulse"
          aria-hidden
        />
        <span className="relative flex size-5 items-center justify-center rounded-full border-2 border-primary bg-background">
          <span className="size-2 rounded-full bg-primary" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full border border-border bg-background">
      <span className="size-1.5 rounded-full bg-muted-foreground/25" />
    </span>
  );
}

/**
 * Presentational horizontal timeline — one continuous track filled up to the
 * current stage. Shared by the internal Overview (interactive: pass
 * onSelectStage), the Client View preview, and the client portal (read-only).
 */
export function ProjectTimeline({
  items,
  progress,
  onSelectStage,
}: {
  items: TimelineStageLike[];
  progress: number;
  onSelectStage?: (id: string) => void;
}) {
  const done = items.filter((i) => i.status === "completed").length;
  const currentIdx = items.findIndex(
    (i) => i.status !== "completed" && i.status !== "skipped"
  );
  const current = currentIdx >= 0 ? items[currentIdx] : null;
  const filledPct =
    currentIdx >= 0 ? ((currentIdx + 0.5) / items.length) * 100 : 100;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No stages yet for this project.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Current stage
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">
            {current ? current.stage_name : "All stages complete"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {current
              ? `Stage ${currentIdx + 1} of ${items.length}`
              : `${items.length} of ${items.length}`}{" "}
            · {done} done
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xl font-semibold tabular-nums">{progress}%</span>
        </div>
      </div>

      <div className="overflow-x-auto py-1">
        <div className="relative min-w-max">
          {/* one continuous track, with the completed portion filled */}
          <div
            className="pointer-events-none absolute top-4 right-0 left-0 h-px -translate-y-1/2 bg-border"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-4 left-0 h-px -translate-y-1/2 bg-primary/60"
            style={{ width: `${filledPct}%` }}
            aria-hidden
          />
          <ol className="relative flex">
            {items.map((item, idx) => {
              const isCurrent = idx === currentIdx;
              const node = <StageNode status={item.status} current={isCurrent} />;
              return (
                <li
                  key={item.id}
                  className="flex w-[7.5rem] shrink-0 flex-col items-center px-1"
                >
                  <div className="flex h-8 items-center justify-center">
                    {onSelectStage ? (
                      <button
                        type="button"
                        onClick={() => onSelectStage(item.id)}
                        className="relative z-10 flex items-center justify-center rounded-full outline-none transition hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/50"
                        title={`${item.stage_name} — click to update`}
                      >
                        {node}
                      </button>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center">
                        {node}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-3 line-clamp-2 max-w-[7rem] text-center text-[11px] leading-snug",
                      isCurrent
                        ? "font-medium text-foreground"
                        : "text-muted-foreground/70"
                    )}
                  >
                    {item.stage_name}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
