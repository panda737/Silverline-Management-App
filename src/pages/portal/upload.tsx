/**
 * Client response control: say something, attach something, or both.
 *
 * This exists because of a specific failure. Everything the client has given us
 * so far arrived by email, into one person's mailbox, and reached the record
 * only when that person forwarded it — twice it did not, and once an answer sat
 * unread for five days. An upload lands on the project, dated, visible to
 * everyone, attributed to whoever sent it.
 */
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Matches the staff-side convention: <project_id>/<random>-<filename>. */
function storagePathFor(projectId: string, fileName: string) {
  const safe = fileName.replace(/[^\w.-]+/g, "_").slice(-120);
  return `${projectId}/${crypto.randomUUID()}-${safe}`;
}

export function ClientResponse({
  projectId,
  factId,
  factLabel,
  onDone,
}: {
  projectId: string;
  factId: string;
  factLabel: string;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      // Files first — if an upload fails we have not yet claimed the item is
      // answered.
      for (const file of files) {
        const path = storagePathFor(projectId, file.name);
        const { error: upErr } = await supabase.storage
          .from("project-documents")
          .upload(path, file, { upsert: false });
        if (upErr) throw new Error(`${file.name}: ${upErr.message}`);

        const { error: rowErr } = await supabase.from("documents").insert({
          project_id: projectId,
          name: file.name,
          doc_type: "client_information",
          storage_path: path,
          client_visible: true,
          uploaded_by: userId,
          notes: `Sent from the portal in answer to: ${factLabel}`,
        });
        if (rowErr) throw new Error(`${file.name}: ${rowErr.message}`);
      }

      const body = comment.trim();
      if (body || files.length) {
        const { error } = await supabase.from("project_fact_responses").insert({
          fact_id: factId,
          project_id: projectId,
          state: "disputed", // "the client has said something about this"
          comment:
            body ||
            `${files.length} document${files.length === 1 ? "" : "s"} attached.`,
          responded_by: userId,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      setComment("");
      setFiles([]);
      toast.success("Thank you — that has come through to the team.");
      void qc.invalidateQueries({ queryKey: ["portal", "facts", projectId] });
      void qc.invalidateQueries({ queryKey: ["portal", "project", projectId] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nothingToSend = !comment.trim() && files.length === 0;

  return (
    <div className="space-y-2 pt-1">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything you can tell us helps — a figure, a date, or just what we have wrong. You can attach a document too."
        rows={3}
      />

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs"
            >
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                className="text-muted-foreground transition hover:text-foreground"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={send.isPending}
        >
          <Paperclip className="size-3.5" />
          Attach a document
        </Button>
        <Button
          size="sm"
          type="button"
          disabled={send.isPending || nothingToSend}
          onClick={() => send.mutate()}
        >
          {send.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Send to the team
        </Button>
      </div>
    </div>
  );
}
