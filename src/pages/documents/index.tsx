import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { getProjectDocumentUrl } from "@/pages/projects/detail/files-actions";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DOC_TYPE_LABELS } from "@/lib/labels";
import type { DocType } from "@/lib/database.types";

type DocumentRowData = {
  id: string;
  name: string;
  doc_type: DocType;
  storage_path: string;
  version: number;
  client_visible: boolean;
  created_at: string;
  project: { id: string; name: string; client: { company_name: string } | null } | null;
};

async function download(doc: DocumentRowData) {
  const result = await getProjectDocumentUrl(doc);
  if (result.error || !result.url) {
    toast.error(result.error ?? "Could not create a download link.");
    return;
  }
  window.open(result.url, "_blank");
}

export default function DocumentsPage() {
  useDocumentTitle("Documents");

  const { data, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, name, doc_type, storage_path, version, client_visible, created_at, project:projects(id, name, client:clients(company_name))"
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Failed to load documents: ${error.message}`);
      return (data ?? []) as unknown as DocumentRowData[];
    },
  });
  if (error) throw error;
  if (!data) return null;

  const documents = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="All project documents across clients."
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload files from a project's Documents tab. Files marked client-visible appear in the client portal; everything else stays internal."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
                <TableHead className="hidden lg:table-cell">Client</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="hidden sm:table-cell">Added</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Download</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-72">
                    <span className="block truncate font-medium">
                      {d.name}
                      {d.version > 1 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          v{d.version}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {DOC_TYPE_LABELS[d.doc_type]}
                  </TableCell>
                  <TableCell className="hidden max-w-56 md:table-cell">
                    {d.project ? (
                      <Link
                        to={`/projects/${d.project.id}`}
                        className="block truncate text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {d.project.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {d.project?.client?.company_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {d.client_visible ? (
                      <Badge className="rounded-full border-emerald-500/25 bg-emerald-500/10 px-2 py-px text-[11px] leading-[18px] font-medium text-emerald-700 dark:text-emerald-400">
                        Client-visible
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-full px-2 py-px text-[11px] leading-[18px] font-medium text-muted-foreground"
                      >
                        Internal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {format(new Date(d.created_at), "d MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => download(d)}
                      title="Download"
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
