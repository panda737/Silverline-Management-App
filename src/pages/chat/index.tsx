/**
 * Assistant — a conversational view over the portal's own records.
 *
 * Everything shown is read through the `chat` edge function, which queries as
 * the signed-in user, so the assistant can only see what the person asking
 * could already open. The same panel is embedded on the project detail page
 * pinned to one project.
 */
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ChatPanel } from "./chat-panel";

export default function ChatPage() {
  useDocumentTitle("Assistant");

  return (
    // The header is 3rem and the layout container adds 1.5rem top and bottom, so
    // subtracting 6rem makes the card exactly fill the viewport. Without a fixed
    // height the composer would sit below the fold on a long conversation.
    <div className="flex h-[calc(100svh-6rem)] flex-col gap-4">
      <PageHeader
        title="Assistant"
        description="Ask about projects, deadlines, tasks and filed documents. Answers are read from the portal's records, scoped to what you can see."
      />
      <Card className="min-h-0 flex-1 px-4 py-3 sm:px-5">
        <ChatPanel className="h-full" />
      </Card>
    </div>
  );
}
