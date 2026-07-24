import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileText, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DOC_TYPE_LABELS } from "@/lib/labels";
import type { DocType } from "@/lib/database.types";
import { getProjectDocumentUrl } from "@/pages/projects/detail/files-actions";

type DocumentRowData = {
  id: string;
  name: string;
  doc_type: DocType;
  storage_path: string;
  version: number;
  client_visible: boolean;
  created_at: string;
  folder: { id: string; name: string } | null;
  project: {
    id: string;
    name: string;
    client: { company_name: string } | null;
  } | null;
};

async function download(doc: DocumentRowData) {
  const result = await getProjectDocumentUrl(doc);
  if (result.error || !result.url) {
    toast.error(result.error ?? "Could not create a download link.");
    return;
  }
  window.open(result.url, "_blank");
}

const ALL = "__all__";

export default function DocumentsPage() {
  useDocumentTitle("Documents");

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(ALL);
  const [folderFilter, setFolderFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);

  const { data, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, name, doc_type, storage_path, version, client_visible, created_at, folder:project_folders(id, name), project:projects(id, name, client:clients(company_name))"
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Failed to load documents: ${error.message}`);
      return (data ?? []) as unknown as DocumentRowData[];
    },
  });

  // Every hook runs before the early returns below — never conditionally.
  const docs = useMemo(() => data ?? [], [data]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of docs) {
      if (doc.project) map.set(doc.project.id, doc.project.name);
    }
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [docs]);

  // Folder names repeat across projects (they're the same standard set), so
  // filter by name rather than id.
  const folderNames = useMemo(() => {
    const names = new Set<string>();
    for (const doc of docs) if (doc.folder) names.add(doc.folder.name);
    return [...names].sort();
  }, [docs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return docs.filter((doc) => {
      if (term && !doc.name.toLowerCase().includes(term)) {
        const project = doc.project?.name.toLowerCase() ?? "";
        const client = doc.project?.client?.company_name.toLowerCase() ?? "";
        if (!project.includes(term) && !client.includes(term)) return false;
      }
      if (projectFilter !== ALL && doc.project?.id !== projectFilter) return false;
      if (folderFilter !== ALL && doc.folder?.name !== folderFilter) return false;
      if (typeFilter !== ALL && doc.doc_type !== typeFilter) return false;
      return true;
    });
  }, [docs, search, projectFilter, folderFilter, typeFilter]);

  if (error) throw error;
  if (!data) return null;

  const filtersActive =
    !!search ||
    projectFilter !== ALL ||
    folderFilter !== ALL ||
    typeFilter !== ALL;

  const clearFilters = () => {
    setSearch("");
    setProjectFilter(ALL);
    setFolderFilter(ALL);
    setTypeFilter(ALL);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Every file across every project. Upload and file documents from a project's Documents tab."
      />

      {data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Open a project, go to its Documents tab, and upload into one of the standard folders."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by file, project or client…"
                className="h-9 pl-8"
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All projects</SelectItem>
                {projects.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All folders</SelectItem>
                {folderNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-3.5" />
                Clear
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} of {data.length} file
            {data.length === 1 ? "" : "s"}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching documents"
              description="Try a different search term or clear the filters."
            >
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden lg:table-cell">Folder</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Project</TableHead>
                    <TableHead className="hidden xl:table-cell">Client</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="hidden sm:table-cell">Added</TableHead>
                    <TableHead className="w-12 text-right">
                      <span className="sr-only">Download</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="max-w-64">
                        <button
                          type="button"
                          onClick={() => download(d)}
                          className="block max-w-full truncate text-left font-medium hover:underline"
                          title="Download"
                        >
                          {d.name}
                          {d.version > 1 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              v{d.version}
                            </span>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="hidden max-w-40 text-muted-foreground lg:table-cell">
                        <span className="block truncate text-xs">
                          {d.folder?.name ?? "Unfiled"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        <span className="text-xs">
                          {DOC_TYPE_LABELS[d.doc_type]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-48 md:table-cell">
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
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
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
                        <span className="text-xs">
                          {format(new Date(d.created_at), "d MMM yyyy")}
                        </span>
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
        </>
      )}
    </div>
  );
}
