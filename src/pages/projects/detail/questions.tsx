/**
 * The staff side of the client Q&A — where a question actually gets answered.
 *
 * ⛔ AN ANSWER SAVED HERE IS PUBLISHED TO THE CLIENT IMMEDIATELY. There is no
 * draft state and no approval step: whoever writes it is publishing it. That is
 * deliberate — a half-sent answer is worse than none — but it means the box
 * carries the warning, and it means an agent never touches it (AGENTS.md §7,
 * nothing goes to a client without instruction).
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Clock, Loader2, MessagesSquare, Send } from "lucide-react";
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

function AnswerBox({
  question,
  projectId,
}: {
  question: PortalQuestionRow;
  projectId: string;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const answer = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("project_questions")
        .update({
          answer: draft.trim(),
          answered_by: auth.user?.id ?? null,
          answered_at: new Date().toISOString(),
        })
        .eq("id", question.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setDraft("");
      toast.success("Answered. The client can see it now.");
      void qc.invalidateQueries({ queryKey: ["project", "questions", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Your answer…"
        rows={3}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-3.5 shrink-0" />
          This goes straight to the client. There is no draft or review step.
        </p>
        <Button
          size="sm"
          type="button"
          disabled={answer.isPending || !draft.trim()}
          onClick={() => answer.mutate()}
        >
          {answer.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Answer the client
        </Button>
      </div>
    </div>
  );
}

export function ProjectQuestions({ projectId }: { projectId: string }) {
  const { data: questions = [], isPending } = useQuery({
    queryKey: ["project", "questions", projectId],
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

  const open = questions.filter((q) => q.answer === null);

  if (isPending) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted/40" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">Questions from the client</h3>
        {open.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {open.length} waiting
          </Badge>
        )}
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <MessagesSquare className="mx-auto mb-2 size-5 opacity-50" />
            No questions yet. When the client asks something in their portal it
            lands here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm whitespace-pre-wrap">{q.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.asked_by_name ?? "The client"} · {fmtDate(q.created_at)}
                    </p>
                  </div>
                  {q.answer === null && (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <Clock className="size-3" />
                      Waiting
                    </Badge>
                  )}
                </div>

                {q.answer === null ? (
                  <AnswerBox question={q} projectId={projectId} />
                ) : (
                  <div className="space-y-1 rounded-lg border-l-2 border-primary/50 bg-muted/40 p-4">
                    <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.answered_by_name ?? "Silverline"} ·{" "}
                      {fmtDate(q.answered_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
