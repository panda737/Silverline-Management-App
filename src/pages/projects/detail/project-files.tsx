import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Download,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DOC_TYPE_LABELS } from "@/lib/labels";
import type {
  DocType,
  DocumentRow,
  ProjectFolderRow,
} from "@/lib/database.types";
import {
  createProjectFolder,
  deleteProjectDocument,
  deleteProjectFolder,
  getProjectDocumentUrl,
  moveDocumentToFolder,
  renameProjectFolder,
  setDocumentVisibility,
  uploadProjectDocument,
} from "./files-actions";

type DocWithUploader = DocumentRow & {
  uploader: { full_name: string } | null;
};

const UNFILED = "__unfiled__";

/**
 * One row in the folder list. Module-level (not nested in ProjectFiles) so its
 * component identity is stable — a redefined component remounts on every parent
 * render and would close an open folder menu.
 */
function FolderButton({
  label,
  icon: Icon,
  count,
  active,
  folder,
  onSelect,
  onRename,
  onDelete,
}: {
  label: string;
  icon: typeof Folder;
  count: number;
  active: boolean;
  folder?: ProjectFolderRow;
  onSelect: () => void;
  onRename?: (folder: ProjectFolderRow) => void;
  onDelete?: (folder: ProjectFolderRow) => void;
}) {
  return (
    <div
      className={cn(
        "group/folder flex items-center gap-1 rounded-md pr-1 transition-colors",
        active ? "bg-accent" : "hover:bg-accent/60"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            active ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "flex-1 truncate text-[13px]",
            active ? "font-medium" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {count || ""}
        </span>
      </button>
      {folder && onRename && onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/folder:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
              <span className="sr-only">Folder options</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onRename(folder)}>
              <Pencil className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(folder)}>
              <Trash2 className="size-3.5" />
              Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * Project document store: standard folders down the left, files in the selected
 * folder on the right. Files live in a private bucket and are only ever served
 * through short-lived signed URLs.
 */
export function ProjectFiles({ projectId }: { projectId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("supporting_document");
  const [clientVisible, setClientVisible] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>(UNFILED);
  const [uploading, setUploading] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renaming, setRenaming] = useState<ProjectFolderRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: folders } = useQuery({
    queryKey: ["project", projectId, "folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_folders")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as ProjectFolderRow[];
    },
  });

  const { data: docs } = useQuery({
    queryKey: ["project", projectId, "documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, uploader:profiles(full_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as DocWithUploader[];
    },
  });

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const doc of docs ?? []) {
      const key = doc.folder_id ?? UNFILED;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [docs]);

  const unfiledCount = counts.get(UNFILED) ?? 0;

  const visibleDocs = useMemo(() => {
    if (!docs) return [];
    if (selected === null) return docs;
    if (selected === UNFILED) return docs.filter((d) => !d.folder_id);
    return docs.filter((d) => d.folder_id === selected);
  }, [docs, selected]);

  const selectedFolder =
    selected && selected !== UNFILED
      ? (folders ?? []).find((f) => f.id === selected)
      : undefined;

  const openUpload = () => {
    setUploadFolder(selected && selected !== UNFILED ? selected : UNFILED);
    fileRef.current?.click();
  };

  const upload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const error = await uploadProjectDocument({
      projectId,
      file: pendingFile,
      docType,
      clientVisible,
      folderId: uploadFolder === UNFILED ? null : uploadFolder,
    });
    setUploading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`${pendingFile.name} uploaded.`);
    setPendingFile(null);
    setClientVisible(false);
  };

  const download = async (doc: DocWithUploader) => {
    const result = await getProjectDocumentUrl(doc);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Could not create a download link.");
      return;
    }
    window.open(result.url, "_blank");
  };

  const addFolder = async () => {
    setBusy(true);
    const error = await createProjectFolder(projectId, newFolderName);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setNewFolderOpen(false);
    setNewFolderName("");
  };

  const submitRename = async () => {
    if (!renaming) return;
    setBusy(true);
    const error = await renameProjectFolder(renaming, renameValue);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setRenaming(null);
  };

  const removeFolder = async (folder: ProjectFolderRow) => {
    const count = counts.get(folder.id) ?? 0;
    const message =
      count > 0
        ? `Delete the folder "${folder.name}"? Its ${count} file${count === 1 ? "" : "s"} will move to Unfiled — no files are deleted.`
        : `Delete the folder "${folder.name}"?`;
    if (!window.confirm(message)) return;
    const error = await deleteProjectFolder(folder);
    if (error) {
      toast.error(error);
      return;
    }
    if (selected === folder.id) setSelected(null);
  };

  const startRename = (folder: ProjectFolderRow) => {
    setRenaming(folder);
    setRenameValue(folder.name);
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Document store</h3>
          <p className="text-xs text-muted-foreground">
            Every file for this project, filed by folder. Private bucket,
            5-minute signed download links, clients see only what you share.
          </p>
        </div>
        <Button size="sm" onClick={openUpload}>
          <Upload className="size-3.5" />
          Upload file
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPendingFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        {/* Folders */}
        <div className="space-y-0.5 lg:border-r lg:pr-3">
          <FolderButton
            label="All files"
            icon={FolderOpen}
            count={docs?.length ?? 0}
            active={selected === null}
            onSelect={() => setSelected(null)}
          />
          <div className="my-1 border-t" />
          {(folders ?? []).map((folder) => (
            <FolderButton
              key={folder.id}
              label={folder.name}
              icon={Folder}
              count={counts.get(folder.id) ?? 0}
              active={selected === folder.id}
              folder={folder}
              onSelect={() => setSelected(folder.id)}
              onRename={startRename}
              onDelete={removeFolder}
            />
          ))}
          {unfiledCount > 0 && (
            <FolderButton
              label="Unfiled"
              icon={Inbox}
              count={unfiledCount}
              active={selected === UNFILED}
              onSelect={() => setSelected(UNFILED)}
            />
          )}
          <button
            type="button"
            onClick={() => setNewFolderOpen(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <FolderPlus className="size-4 shrink-0" />
            New folder
          </button>
        </div>

        {/* Files in the selected folder */}
        <div className="min-w-0 space-y-2">
          <p className="text-xs text-muted-foreground">
            {selected === null
              ? "All files"
              : selected === UNFILED
                ? "Unfiled"
                : (selectedFolder?.name ?? "")}
            {" · "}
            {visibleDocs.length} file{visibleDocs.length === 1 ? "" : "s"}
          </p>

          {visibleDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-6 py-12 text-center">
              <Folder className="mb-1 size-5 text-muted-foreground/70" />
              <p className="text-sm font-medium">Nothing filed here yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Upload a file, or move an existing one into this folder from the
                menu on its row.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    {selected === null && (
                      <TableHead className="hidden lg:table-cell">
                        Folder
                      </TableHead>
                    )}
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Uploaded
                    </TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="w-20 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="max-w-64">
                        <button
                          type="button"
                          onClick={() => download(doc)}
                          className="block max-w-full truncate text-left font-medium hover:underline"
                          title="Download"
                        >
                          {doc.name}
                        </button>
                      </TableCell>
                      {selected === null && (
                        <TableCell className="hidden max-w-40 text-muted-foreground lg:table-cell">
                          <span className="block truncate text-xs">
                            {(folders ?? []).find((f) => f.id === doc.folder_id)
                              ?.name ?? "Unfiled"}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        <span className="text-xs">
                          {DOC_TYPE_LABELS[doc.doc_type]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        <span className="text-xs">
                          {format(new Date(doc.created_at), "d MMM yyyy")}
                          {doc.uploader?.full_name && (
                            <span className="block">
                              by {doc.uploader.full_name}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={async () => {
                            const error = await setDocumentVisibility(
                              doc,
                              !doc.client_visible
                            );
                            if (error) toast.error(error);
                          }}
                          title={
                            doc.client_visible
                              ? "Visible in the client portal — click to make internal"
                              : "Internal only — click to share with the client"
                          }
                        >
                          {doc.client_visible ? (
                            <Badge className="gap-1 rounded-full border-emerald-500/25 bg-emerald-500/10 px-2 py-px text-[11px] leading-[18px] font-medium text-emerald-700 dark:text-emerald-400">
                              <Eye className="size-3" />
                              Client
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 rounded-full px-2 py-px text-[11px] leading-[18px] font-medium text-muted-foreground"
                            >
                              <EyeOff className="size-3" />
                              Internal
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => download(doc)}
                            title="Download"
                          >
                            <Download className="size-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-3.5" />
                                <span className="sr-only">File options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="text-xs">
                                Move to folder
                              </DropdownMenuLabel>
                              <div className="max-h-64 overflow-y-auto">
                                {(folders ?? []).map((folder) => (
                                  <DropdownMenuItem
                                    key={folder.id}
                                    disabled={doc.folder_id === folder.id}
                                    onClick={async () => {
                                      const error = await moveDocumentToFolder(
                                        doc,
                                        folder.id
                                      );
                                      if (error) toast.error(error);
                                    }}
                                  >
                                    <Folder className="size-3.5" />
                                    {folder.name}
                                  </DropdownMenuItem>
                                ))}
                              </div>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (
                                    !window.confirm(
                                      `Delete "${doc.name}"? This cannot be undone.`
                                    )
                                  )
                                    return;
                                  const error = await deleteProjectDocument(doc);
                                  if (error) toast.error(error);
                                  else toast.success("Document deleted.");
                                }}
                              >
                                <Trash2 className="size-3.5" />
                                Delete file
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Upload dialog */}
      <Dialog
        open={!!pendingFile}
        onOpenChange={(v) => !v && !uploading && setPendingFile(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription className="truncate">
              {pendingFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(folders ?? []).map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={UNFILED}>Unfiled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as DocType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div>
                <Label className="text-sm">Visible to the client</Label>
                <p className="text-xs text-muted-foreground">
                  Off = internal only.
                </p>
              </div>
              <Switch
                checked={clientVisible}
                onCheckedChange={setClientVisible}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingFile(null)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={upload} disabled={uploading}>
              {uploading && <Loader2 className="size-3.5 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              For anything the standard set doesn&apos;t cover — e.g.
              &ldquo;Submission – Amendment Aug 2026&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => e.key === "Enter" && void addFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addFolder} disabled={busy}>
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder */}
      <Dialog open={!!renaming} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submitRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={busy}>
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
