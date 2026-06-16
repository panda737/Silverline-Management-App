"use client";

import { useActionState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ProjectCommentRow } from "@/lib/database.types";
import { addProjectNote, type FormState } from "../wml-actions";

const initialState: FormState = {};

type CommentWithAuthor = ProjectCommentRow & { author: { full_name: string } | null };

export function WmlNotes({
  projectId,
  comments,
}: {
  projectId: string;
  comments: CommentWithAuthor[];
}) {
  const action = addProjectNote.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Internal notes and client-visible updates for this project.
      </p>
      <form ref={formRef} action={formAction} className="space-y-2">
          <Textarea name="body" rows={2} placeholder="Add a note…" required />
          {state.fieldErrors?.body && (
            <p className="text-sm text-destructive">{state.fieldErrors.body[0]}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <Select name="visibility" defaultValue="internal">
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal note</SelectItem>
                <SelectItem value="client">Client-visible</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Add note
            </Button>
          </div>
        </form>

        {comments.length > 0 && <Separator />}

        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {c.author?.full_name ?? "Unknown"}
                </span>
                <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                <span
                  className={
                    c.visibility === "client"
                      ? "rounded-full border border-sky-500/25 bg-sky-500/10 px-1.5 text-[11px] text-sky-700 dark:text-sky-400"
                      : "rounded-full border border-border bg-muted px-1.5 text-[11px]"
                  }
                >
                  {c.visibility === "client" ? "Client-visible" : "Internal"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
    </div>
  );
}
