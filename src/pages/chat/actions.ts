import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";
import type { ChatThreadRow } from "@/lib/database.types";

/**
 * Actions for the project chat. Thread lifecycle happens straight from the
 * browser under RLS; only the turn itself goes through the `chat` edge function,
 * which needs a server-side Anthropic key.
 *
 * Pre-checks here are UX only — RLS is the enforcement boundary, and the
 * function re-checks the caller independently.
 */

const invalidateThreads = () => {
  queryClient.invalidateQueries({ queryKey: ["chat/threads"] });
};

export async function createThread(input: {
  firstMessage: string;
  projectId?: string | null;
}): Promise<{ id?: string; error?: string }> {
  const profile = await getActionProfile();
  if (!profile || profile.role === "client" || !profile.active) {
    return { error: "Internal users only." };
  }

  // Titled from the opening question rather than asking for one, so starting a
  // conversation costs a single keystroke. Renameable afterwards.
  const firstLine = input.firstMessage.trim().split("\n")[0];
  const title =
    firstLine.length > 70 ? `${firstLine.slice(0, 70).trimEnd()}…` : firstLine;

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      owner_id: profile.id,
      project_id: input.projectId ?? null,
      title: title || "New conversation",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  invalidateThreads();
  return { id: data.id };
}

export async function renameThread(
  id: string,
  title: string
): Promise<string | null> {
  const trimmed = title.trim();
  if (!trimmed) return "Title cannot be empty.";
  const { error } = await supabase
    .from("chat_threads")
    .update({ title: trimmed })
    .eq("id", id);
  if (error) return error.message;
  invalidateThreads();
  return null;
}

export async function deleteThread(id: string): Promise<string | null> {
  const { error } = await supabase.from("chat_threads").delete().eq("id", id);
  if (error) return error.message;
  invalidateThreads();
  queryClient.removeQueries({ queryKey: ["chat/messages", id] });
  return null;
}

export async function listThreads(projectId?: string | null) {
  let q = supabase
    .from("chat_threads")
    .select("*")
    .order("last_message_at", { ascending: false });
  // A pinned view shows only that project's threads; the global view shows all,
  // including pinned ones, so a conversation is never hidden from its owner.
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatThreadRow[];
}

/** Events the `chat` function emits, in the order a normal turn produces them. */
export type ChatStreamEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "tool_done"; name: string; summary: string }
  | { type: "error"; message: string }
  | {
      type: "done";
      usage: {
        input_tokens: number;
        output_tokens: number;
        cache_read_tokens: number;
      };
      save_error: string | null;
    };

/**
 * Send a turn and stream the reply.
 *
 * Deliberately NOT `supabase.functions.invoke` — that buffers the whole response
 * before resolving, which would turn a streaming answer into a long silence
 * followed by a wall of text. Plain fetch with the session's access token gets
 * the same authorisation (the function reads the same bearer header) while
 * letting us read the body as it arrives.
 */
export async function streamTurn(
  input: { threadId: string; message: string },
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return "Your session has expired — please sign in again.";

  const base = import.meta.env.VITE_SUPABASE_URL;
  let res: Response;
  try {
    res = await fetch(`${base}/functions/v1/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: input.threadId,
        message: input.message,
      }),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) return null;
    return e instanceof Error ? e.message : "Could not reach the assistant.";
  }

  if (!res.ok || !res.body) {
    // The function reports its own failures as JSON, so surface that rather than
    // a bare status code.
    let message = `Assistant returned ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {
      // Non-JSON body — keep the status message.
    }
    return message;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line. A frame can straddle two
      // chunks, so anything after the last separator stays in the buffer.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue;
        try {
          onEvent(JSON.parse(line.slice(5).trim()) as ChatStreamEvent);
        } catch {
          // A frame we cannot parse is not worth failing the whole turn over.
        }
      }
    }
  } catch (e) {
    if (signal?.aborted) return null;
    return e instanceof Error ? e.message : "The reply was interrupted.";
  }

  invalidateThreads();
  return null;
}
