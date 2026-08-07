import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { assignForReview, fetchReviewers } from "./actions";

type PickableDocument = {
  id: string;
  name: string;
  version: number;
  project: { id: string; name: string } | null;
};

async function fetchDocuments(): Promise<PickableDocument[]> {
  const { data } = await supabase
    .from("documents")
    .select("id, name, version, project:projects ( id, name )")
    .order("created_at", { ascending: false })
    .limit(300);
  return (data ?? []) as unknown as PickableDocument[];
}

/**
 * Send one or more documents to a colleague for review.
 *
 * Multi-select on purpose: publishing sixteen specialist studies is one act of
 * work and should produce one batch and one notification, not sixteen.
 */
export function SendForReviewDialog({ onSent }: { onSent?: () => void }) {
  const [open, setOpen] = useState(false);
  const [reviewerId, setReviewerId] = useState<string>("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const reviewers = useQuery({
    queryKey: ["reviewers"],
    queryFn: fetchReviewers,
    enabled: open,
  });
  const documents = useQuery({
    queryKey: ["documents", "pickable"],
    queryFn: fetchDocuments,
    enabled: open,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = documents.data ?? [];
    if (!q) return all.slice(0, 60);
    return all
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.project?.name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [documents.data, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = async () => {
    if (!reviewerId) {
      toast.error("Choose who should review these.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Choose at least one document.");
      return;
    }
    setSaving(true);
    const err = await assignForReview({
      documentIds: [...selected],
      reviewerId,
      note,
    });
    setSaving(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(
      `Sent ${selected.size} document${selected.size === 1 ? "" : "s"} for review.`
    );
    setSelected(new Set());
    setNote("");
    setOpen(false);
    onSent?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send />
          Send for review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85svh] gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send documents for review</DialogTitle>
          <DialogDescription>
            Everything you pick goes across as one batch, so the reviewer gets a
            single notification rather than one per file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reviewer">Reviewer</Label>
          <Select value={reviewerId} onValueChange={setReviewerId}>
            <SelectTrigger id="reviewer">
              <SelectValue placeholder="Choose a person…" />
            </SelectTrigger>
            <SelectContent>
              {(reviewers.data ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.full_name || r.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Documents</Label>
            {selected.size > 0 && (
              <Badge variant="secondary">{selected.size} selected</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by document or project…"
              className="pl-8"
            />
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-1">
            {documents.isPending ? (
              <p className="p-3 text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                No documents match.
              </p>
            ) : (
              filtered.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={selected.has(d.id)}
                    onChange={() => toggle(d.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.project?.name ?? "No project"} · v{d.version}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Anything they should know before they start…"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={send} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
