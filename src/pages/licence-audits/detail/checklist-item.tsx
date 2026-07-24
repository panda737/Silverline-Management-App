import { memo, useState } from "react";
import { FileSearch, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ITEM_STATUS_LABELS,
  type LicenceChecklistItem,
  type LicenceItemStatus,
  type LicencePriority,
} from "@/lib/licence-audit";
import { generateCorrectiveAction } from "../actions";

const STATUS_STYLES: Record<LicenceItemStatus, string> = {
  compliant:
    "data-[active=true]:border-emerald-500/40 data-[active=true]:bg-emerald-500/10 data-[active=true]:text-emerald-700 dark:data-[active=true]:text-emerald-400",
  partial:
    "data-[active=true]:border-amber-500/40 data-[active=true]:bg-amber-500/10 data-[active=true]:text-amber-700 dark:data-[active=true]:text-amber-400",
  non_compliant:
    "data-[active=true]:border-red-500/40 data-[active=true]:bg-red-500/10 data-[active=true]:text-red-700 dark:data-[active=true]:text-red-400",
  not_applicable:
    "data-[active=true]:border-border data-[active=true]:bg-muted data-[active=true]:text-foreground",
};

const STATUSES: LicenceItemStatus[] = [
  "compliant",
  "partial",
  "non_compliant",
  "not_applicable",
];

export const ChecklistItemRow = memo(function ChecklistItemRow({
  item,
  onChange,
  onViewPage,
}: {
  item: LicenceChecklistItem;
  onChange: (patch: Partial<LicenceChecklistItem>) => void;
  onViewPage: (page: number) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const needsFinding =
    item.status === "partial" || item.status === "non_compliant";

  const suggest = async () => {
    if (!item.status || !needsFinding) return;
    setSuggesting(true);
    const result = await generateCorrectiveAction({
      requirement: item.requirement,
      ref: item.ref,
      observation: item.observation,
      status: item.status,
    });
    setSuggesting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    onChange({
      correctiveAction: result.corrective_action,
      priority: item.priority ?? result.priority,
    });
  };

  return (
    <div
      className={cn(
        "space-y-3 px-4 py-4",
        !item.auditable && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
            {item.id}
          </span>
          {item.page > 0 && (
            <button
              type="button"
              onClick={() => onViewPage(item.page)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              title="Show this condition in the document"
            >
              <FileSearch className="size-3" />
              p. {item.page}
            </button>
          )}
          {!item.auditable && (
            <span className="text-[11px] text-muted-foreground">
              Informational — not audited
            </span>
          )}
        </div>

        {item.auditable && (
          <div className="flex flex-wrap gap-1">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                data-active={item.status === status}
                onClick={() =>
                  onChange({
                    status: item.status === status ? null : status,
                  })
                }
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted",
                  STATUS_STYLES[status]
                )}
              >
                {ITEM_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed">
        {item.requirement}
      </p>

      {item.auditable && needsFinding && (
        <div className="space-y-3 rounded-md border bg-muted/40 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Observation / finding</Label>
            <Textarea
              value={item.observation}
              onChange={(e) => onChange({ observation: e.target.value })}
              placeholder="What did you observe on site or in the records?"
              rows={2}
              className="bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Corrective action</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={suggest}
                disabled={suggesting}
              >
                {suggesting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Suggest with AI
              </Button>
            </div>
            <Textarea
              value={item.correctiveAction}
              onChange={(e) => onChange({ correctiveAction: e.target.value })}
              placeholder="What must the site operator do to close this finding?"
              rows={3}
              className="bg-background text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select
                value={item.priority ?? ""}
                onValueChange={(v) =>
                  onChange({ priority: v as LicencePriority })
                }
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Set priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target date</Label>
              <Input
                type="date"
                value={item.targetDate}
                onChange={(e) => onChange({ targetDate: e.target.value })}
                className="h-8 w-40 text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
