import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  MessageSquarePlus,
  Search,
  Send,
  Sparkles,
  Square,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessageRow, ChatToolCall } from "@/lib/database.types";
import {
  createThread,
  deleteThread,
  listThreads,
  streamTurn,
  type ChatStreamEvent,
} from "./actions";
import { Markdown } from "./markdown";

/** Human labels for the assistant's tools, so the activity line reads as
 *  English rather than as function names. */
const TOOL_LABELS: Record<string, string> = {
  get_dashboard: "Reading the portfolio",
  search_projects: "Searching projects",
  get_project: "Reading the project record",
  list_tasks: "Checking tasks",
  search_documents: "Searching documents",
  read_document: "Reading a document",
};

const SUGGESTIONS_GLOBAL = [
  "What should we focus on this week?",
  "Which projects are at risk, and why?",
  "What deadlines are overdue or coming up?",
  "Which projects have no next action recorded?",
];

const SUGGESTIONS_PROJECT = [
  "Where does this project stand?",
  "What's the next action, and what's blocking it?",
  "What's missing from the document checklist?",
  "Summarise the deadlines and how they were derived.",
];

/** A turn being streamed right now — not yet a persisted row. */
type LiveTurn = {
  question: string;
  answer: string;
  thinking: string;
  tools: { name: string; summary?: string }[];
  error: string | null;
};

function ToolTrace({ calls }: { calls: ChatToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (!calls.length) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="size-3" />
        {calls.length} lookup{calls.length === 1 ? "" : "s"}
        <ChevronDown
          className={cn("size-3 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 border-l border-border pl-3">
          {calls.map((call, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              <span className="text-foreground/80">
                {TOOL_LABELS[call.name] ?? call.name}
              </span>
              {call.summary ? ` — ${call.summary}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/10 px-3.5 py-2 text-[0.9375rem] whitespace-pre-wrap">
          {children}
        </div>
      </div>
    );
  }
  return <div className="max-w-[95%]">{children}</div>;
}

/**
 * The chat surface. Used twice with the same code: standalone on /chat with no
 * project, and inside the project detail tabs pinned to one project.
 *
 * Threads are switched from the header dropdown rather than a sidebar, so the
 * panel drops into a narrow tab body and a full page without a second layout.
 */
export function ChatPanel({
  projectId = null,
  className,
}: {
  projectId?: string | null;
  className?: string;
}) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState<LiveTurn | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = useQuery({
    queryKey: ["chat/threads", projectId],
    queryFn: () => listThreads(projectId),
  });

  const messages = useQuery({
    queryKey: ["chat/messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ChatMessageRow[];
    },
  });

  const activeThread = useMemo(
    () => threads.data?.find((t) => t.id === threadId) ?? null,
    [threads.data, threadId]
  );

  // Stick to the bottom as content grows — the streamed answer is the thing
  // being read, so the newest text should always be in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.data, live]);

  // Abandon an in-flight turn if the panel unmounts (tab switch, navigation).
  // The function stops writing to the dead connection but keeps generating, so
  // the answer is usually persisted and waiting when the thread is reopened —
  // "usually" because the edge runtime may reclaim the isolate once nothing is
  // reading. If it does, the thread shows the question with no answer, which is
  // an honest picture of having stopped it.
  useEffect(() => () => abortRef.current?.abort(), []);

  const streaming = !!live;

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setSendError(null);
    setDraft("");

    let id = threadId;
    if (!id) {
      const created = await createThread({ firstMessage: message, projectId });
      if (created.error || !created.id) {
        setSendError(created.error ?? "Could not start the conversation.");
        return;
      }
      id = created.id;
      setThreadId(id);
    }

    setLive({ question: message, answer: "", thinking: "", tools: [], error: null });

    const controller = new AbortController();
    abortRef.current = controller;

    const onEvent = (event: ChatStreamEvent) => {
      setLive((prev) => {
        if (!prev) return prev;
        switch (event.type) {
          case "text":
            return { ...prev, answer: prev.answer + event.text };
          case "thinking":
            return { ...prev, thinking: prev.thinking + event.text };
          case "tool":
            return { ...prev, tools: [...prev.tools, { name: event.name }] };
          case "tool_done": {
            // Close out the most recent open call with this name.
            const tools = [...prev.tools];
            for (let i = tools.length - 1; i >= 0; i--) {
              if (tools[i].name === event.name && !tools[i].summary) {
                tools[i] = { ...tools[i], summary: event.summary };
                break;
              }
            }
            return { ...prev, tools };
          }
          case "error":
            return { ...prev, error: event.message };
          default:
            return prev;
        }
      });
    };

    const error = await streamTurn({ threadId: id, message }, onEvent, controller.signal);
    abortRef.current = null;

    if (error) setSendError(error);
    // Reload the thread so the rendered turn is the persisted one — the live
    // buffer is dropped rather than kept alongside it, which keeps a reload and
    // a fresh stream showing identical content.
    await queryClient.invalidateQueries({ queryKey: ["chat/messages", id] });
    setLive(null);
  }

  function startNew() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLive(null);
    setThreadId(null);
    setDraft("");
    setSendError(null);
  }

  async function removeThread(id: string) {
    const error = await deleteThread(id);
    if (error) {
      setSendError(error);
      return;
    }
    if (id === threadId) startNew();
    await threads.refetch();
  }

  const suggestions = projectId ? SUGGESTIONS_PROJECT : SUGGESTIONS_GLOBAL;
  const history = messages.data ?? [];
  const isEmpty = !threadId || (!history.length && !live);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {/* Header: which conversation, and how to start another */}
      <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-2 gap-1.5">
              <span className="max-w-[16rem] truncate text-[0.9375rem] font-medium">
                {activeThread?.title ?? "New conversation"}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {threads.data?.length
                ? "Recent conversations"
                : "No conversations yet"}
            </DropdownMenuLabel>
            {threads.data?.map((thread) => (
              <DropdownMenuItem
                key={thread.id}
                onSelect={() => {
                  abortRef.current?.abort();
                  abortRef.current = null;
                  setLive(null);
                  setThreadId(thread.id);
                }}
                className="group flex items-center justify-between gap-2"
              >
                <span className="truncate">{thread.title}</span>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void removeThread(thread.id);
                  }}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </DropdownMenuItem>
            ))}
            {!!threads.data?.length && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={startNew}>
              <MessageSquarePlus className="size-4" />
              New conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={startNew} disabled={isEmpty}>
          <MessageSquarePlus className="size-4" />
          New
        </Button>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto py-4">
        {isEmpty ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-8 text-center">
            <div className="rounded-full bg-primary/10 p-2.5">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[0.9375rem] font-medium">
                Ask about {projectId ? "this project" : "your projects"}
              </p>
              <p className="text-sm text-muted-foreground">
                Answers come from the portal's own records — the same ones you
                can open yourself. It reads and reasons; it never changes
                anything or contacts anyone.
              </p>
            </div>
            <div className="flex w-full flex-col gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-lg border border-border/70 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:bg-accent/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {history.map((m) => (
              <Bubble key={m.id} role={m.role}>
                {m.role === "assistant" ? (
                  <>
                    {m.content ? (
                      <Markdown source={m.content} />
                    ) : (
                      !m.error_message && (
                        <p className="text-sm text-muted-foreground italic">
                          No answer was returned.
                        </p>
                      )
                    )}
                    {m.error_message && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                        {m.error_message}
                      </p>
                    )}
                    <ToolTrace calls={m.tool_calls ?? []} />
                  </>
                ) : (
                  m.content
                )}
              </Bubble>
            ))}

            {live && (
              <>
                <Bubble role="user">{live.question}</Bubble>
                <Bubble role="assistant">
                  {live.tools.map((tool, i) => (
                    <p
                      key={i}
                      className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      {tool.summary ? (
                        <Search className="size-3 shrink-0" />
                      ) : (
                        <Loader2 className="size-3 shrink-0 animate-spin" />
                      )}
                      {tool.summary ?? `${TOOL_LABELS[tool.name] ?? tool.name}…`}
                    </p>
                  ))}
                  {live.answer ? (
                    <Markdown source={live.answer} />
                  ) : (
                    <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
                      <span className="line-clamp-2 italic">
                        {live.thinking.trim().split("\n").filter(Boolean).at(-1) ??
                          "Thinking…"}
                      </span>
                    </p>
                  )}
                  {live.error && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                      {live.error}
                    </p>
                  )}
                </Bubble>
              </>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/70 pt-3">
        {sendError && (
          <p className="mb-2 flex items-start gap-1.5 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            {sendError}
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter is a newline. Chat convention, and the
              // questions here are usually one line.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            placeholder={
              projectId
                ? "Ask about this project…"
                : "Ask about your projects, deadlines or documents…"
            }
            rows={1}
            className="max-h-40 min-h-10 resize-none"
          />
          {streaming ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => abortRef.current?.abort()}
              aria-label="Stop"
            >
              <Square className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => void send(draft)}
              disabled={!draft.trim()}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
