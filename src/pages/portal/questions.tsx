/**
 * The client asking US something.
 *
 * Everything else on this surface is a reply: confirm a fact, correct a fact,
 * send a document. The conversation only ever started from our side, so a
 * client with a question still had to email one person and hope it reached the
 * record — the exact failure this surface exists to close.
 *
 * One question, one answer. Not a chat. A question that needs a conversation
 * needs a call.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Loader2, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { PortalQuestionRow } from "@/lib/database.types";

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

export function usePortalQuestions(projectId: string) {
  return useQuery({
    queryKey: ["portal", "questions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_questions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as PortalQuestionRow[];
    },
  });
}

function QuestionCard({ q }: { q: PortalQuestionRow }) {
  const answered = q.answer !== null;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm whitespace-pre-wrap">{q.body}</p>
            <p className="text-xs text-muted-foreground">
              {q.asked_by_name ?? "You"} · {fmtDate(q.created_at)}
            </p>
          </div>
          {!answered && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Clock className="size-3" />
              With the team
            </Badge>
          )}
        </div>

        {answered && (
          <div className="space-y-1 rounded-lg border-l-2 border-primary/50 bg-muted/40 p-4">
            <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
            <p className="text-xs text-muted-foreground">
              {q.answered_by_name ?? "Silverline"} · {fmtDate(q.answered_at)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PortalQuestions({
  projectId,
  readOnly = false,
}: {
  projectId: string;
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data: questions = [], isPending } = usePortalQuestions(projectId);

  const ask = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("project_questions").insert({
        project_id: projectId,
        body: body.trim(),
        asked_by: auth.user?.id ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setBody("");
      toast.success("Sent — that has come through to the team.");
      void qc.invalidateQueries({ queryKey: ["portal", "questions", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Anything you want to ask about this application — what a stage means,
        what happens next, or why we have asked for something. It goes to the
        team working on your file, and the answer stays here on the record.
      </p>

      {!readOnly && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What would you like to ask?"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                type="button"
                disabled={ask.isPending || !body.trim()}
                onClick={() => ask.mutate()}
              >
                {ask.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send your question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isPending ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <MessagesSquare className="mx-auto mb-2 size-5 opacity-50" />
            No questions yet. Anything you ask, and our answer, will stay here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}
