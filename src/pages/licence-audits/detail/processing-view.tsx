import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LicenceAuditRow } from "@/lib/licence-audit";
import { deleteLicenceAudit, startLicenceReview } from "../actions";

const STEPS = [
  { key: "uploaded", label: "Document uploaded" },
  { key: "reading", label: "AI reading the document" },
  { key: "extracting", label: "Extracting conditions verbatim" },
  { key: "ready", label: "Checklist ready" },
] as const;

function stepIndex(status: LicenceAuditRow["processing_status"]): number {
  const i = STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

/** Live pipeline progress while the licence-review edge function runs. */
export function ProcessingView({ audit }: { audit: LicenceAuditRow }) {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);
  const failed = audit.processing_status === "error";
  const current = stepIndex(audit.processing_status);

  const retry = async () => {
    setRetrying(true);
    const error = await startLicenceReview(audit.id);
    setRetrying(false);
    if (error) toast.error(error);
  };

  const remove = async () => {
    if (!window.confirm("Delete this licence audit and its PDF?")) return;
    const error = await deleteLicenceAudit(audit);
    if (error) {
      toast.error(error);
      return;
    }
    navigate("/licence-audits");
  };

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{audit.file_name}</span>
          </div>

          {failed ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium">The AI review failed</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {audit.error_message ?? "Unknown error."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={retry} disabled={retrying}>
                  {retrying ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="size-3.5" />
                  )}
                  Try again
                </Button>
                <Button size="sm" variant="outline" onClick={remove}>
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {STEPS.map((step, i) => {
                const done = i < current;
                const active = i === current;
                return (
                  <div
                    key={step.key}
                    className={cn(
                      "flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors",
                      active && "bg-muted"
                    )}
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                      {done ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : active ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <span className="size-3 rounded-full border" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm",
                          done && "text-emerald-600 dark:text-emerald-400",
                          active && "font-medium",
                          !done && !active && "text-muted-foreground/60"
                        )}
                      >
                        {step.label}
                      </p>
                      {active && audit.processing_note && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {audit.processing_note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="px-3 pt-2 text-xs text-muted-foreground">
                Reading a long scanned licence can take a few minutes. You can
                leave this page — the review continues in the background.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
