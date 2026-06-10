import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
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

export const metadata: Metadata = { title: "Documents" };

type DocumentRowData = {
  id: string;
  name: string;
  doc_type: DocType;
  version: number;
  client_visible: boolean;
  created_at: string;
  project: { id: string; name: string; client: { company_name: string } | null } | null;
};

export default async function DocumentsPage() {
  await requireInternal();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, name, doc_type, version, client_visible, created_at, project:projects(id, name, client:clients(company_name))"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load documents: ${error.message}`);

  const documents = (data ?? []) as unknown as DocumentRowData[];

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
          description="Documents are uploaded from a project and can be marked client-visible to appear in the client portal. Secure upload and download ship in the next phase."
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
                        href={`/projects/${d.project.id}`}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
