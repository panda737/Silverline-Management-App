import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectTimeline } from "@/components/project-timeline";
import {
  DOC_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/labels";
import { getPortalDocumentUrl } from "./actions";
import { PortalMission } from "./mission";
import type {
  PortalDocumentRow,
  PortalProjectRow,
  PortalTimelineItemRow,
  PortalUpdateRow,
} from "@/lib/database.types";

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMM yyyy") : "—";
}

/** One shared document, with a five-minute signed download link. */
function PortalDocumentRowItem({ doc }: { doc: PortalDocumentRow }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const { url, error } = await getPortalDocumentUrl(doc);
    setBusy(false);
    if (error || !url) {
      toast.error(error ?? "Could not open that file.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-xs text-muted-foreground">
          {DOC_TYPE_LABELS[doc.doc_type]} · {fmtDate(doc.created_at)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={download}
        disabled={busy}
        aria-label={`Download ${doc.name}`}
        className="shrink-0"
      >
        <Download className="size-4" />
      </Button>
    </div>
  );
}

function PortalProjectLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-40 animate-pulse rounded bg-muted/50" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted/50" />
      <div className="h-44 animate-pulse rounded-xl bg-muted/40" />
      <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}

/**
 * Client-facing project detail. Reads ONLY the portal_* views, which are
 * restricted to the signed-in client's own company and to client-visible
 * stages/updates. Renders the same timeline staff see internally.
 */
export default function PortalProjectPage() {
  const { id } = useParams();

  const { data, isPending, error } = useQuery({
    queryKey: ["portal", "project", id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: project }, { data: stages }, { data: updates }, { data: documents }] =
        await Promise.all([
          supabase.from("portal_projects").select("*").eq("id", id!).maybeSingle(),
          supabase
            .from("portal_timeline_items")
            .select("*")
            .eq("project_id", id!)
            .order("sort_order"),
          supabase
            .from("portal_updates")
            .select("*")
            .eq("project_id", id!)
            .order("created_at", { ascending: false }),
          supabase
            .from("portal_documents")
            .select("*")
            .eq("project_id", id!)
            .order("created_at", { ascending: false }),
        ]);
      return {
        project: (project ?? null) as PortalProjectRow | null,
        stages: (stages ?? []) as PortalTimelineItemRow[],
        updates: (updates ?? []) as PortalUpdateRow[],
        documents: (documents ?? []) as PortalDocumentRow[],
      };
    },
  });

  useDocumentTitle(data?.project?.name ?? "Project");

  if (error) throw error;
  if (isPending || !data) return <PortalProjectLoading />;

  const backLink = (
    <Link
      to="/portal"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to your projects
    </Link>
  );

  if (!data.project) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This project isn’t available on your portal.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, stages, updates, documents } = data;

  return (
    <div className="space-y-6">
      {backLink}

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-medium tracking-tight">{project.name}</h1>
          <Badge variant="secondary" className="shrink-0">
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {PROJECT_TYPE_LABELS[project.project_type]}
        </p>
      </div>

      <ProjectTimeline items={stages} />

      <PortalMission projectId={project.id} projectName={project.name} />

      {(project.client_summary || project.manager_name || project.target_date) && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            {project.client_summary && (
              <p className="text-sm text-muted-foreground">{project.client_summary}</p>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              {project.manager_name && (
                <span className="flex items-center gap-1.5">
                  <UserRound className="size-3.5" />
                  {project.manager_name}
                </span>
              )}
              {project.target_date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Target: {fmtDate(project.target_date)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4 text-primary" />
          Documents
        </h2>
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No documents have been shared with you yet. Anything your Silverline
              team shares will appear here.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y pt-6">
              {documents.map((d) => (
                <PortalDocumentRowItem key={d.id} doc={d} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-primary" />
          Updates
        </h2>
        {updates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No updates yet for this project. Your Silverline team will post
              progress updates here.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y pt-6">
              {updates.map((u) => (
                <div key={u.id} className="space-y-1 py-4 first:pt-0 last:pb-0">
                  <p className="text-sm whitespace-pre-wrap">{u.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.author_name ?? "Silverline"} · {fmtDate(u.created_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
