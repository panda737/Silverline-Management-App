import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EmptyState } from "@/components/empty-state";
import { DOC_TYPE_LABELS } from "@/lib/labels";
import type { DocType, DocumentRow } from "@/lib/database.types";
import {
  deleteProjectDocument,
  getProjectDocumentUrl,
  setDocumentVisibility,
  uploadProjectDocument,
} from "./files-actions";

type DocWithUploader = DocumentRow & {
  uploader: { full_name: string } | null;
};

/** Actual project files: upload, download (signed URLs), visibility, delete. */
export function ProjectFiles({ projectId }: { projectId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("supporting_document");
  const [clientVisible, setClientVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const upload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const error = await uploadProjectDocument({
      projectId,
      file: pendingFile,
      docType,
      clientVisible,
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

  const toggleVisibility = async (doc: DocWithUploader) => {
    const error = await setDocumentVisibility(doc, !doc.client_visible);
    if (error) toast.error(error);
  };

  const remove = async (doc: DocWithUploader) => {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    const error = await deleteProjectDocument(doc);
    if (error) toast.error(error);
    else toast.success("Document deleted.");
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Files</h3>
          <p className="text-xs text-muted-foreground">
            Stored in a private bucket — downloads use 5-minute signed links,
            and clients only ever see files marked client-visible.
          </p>
        </div>
        <Button size="sm" onClick={() => fileRef.current?.click()}>
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

      {!docs || docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files uploaded yet"
          description="Upload licences, reports, correspondence and evidence for this project."
          className="py-10"
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-72">
                    <button
                      type="button"
                      onClick={() => download(doc)}
                      className="block max-w-full truncate text-left font-medium hover:underline"
                      title="Download"
                    >
                      {doc.name}
                    </button>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {DOC_TYPE_LABELS[doc.doc_type]}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {format(new Date(doc.created_at), "d MMM yyyy")}
                    {doc.uploader?.full_name && (
                      <span className="block text-xs">
                        by {doc.uploader.full_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleVisibility(doc)}
                      title={
                        doc.client_visible
                          ? "Visible in the client portal — click to make internal"
                          : "Internal only — click to share with the client"
                      }
                    >
                      {doc.client_visible ? (
                        <Badge className="gap-1 rounded-full border-emerald-500/25 bg-emerald-500/10 px-2 py-px text-[11px] leading-[18px] font-medium text-emerald-700 dark:text-emerald-400">
                          <Eye className="size-3" />
                          Client-visible
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => download(doc)}
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(doc)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Upload confirmation dialog: pick type + visibility before it goes up */}
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
                  Off = internal only. The client portal never lists internal
                  files.
                </p>
              </div>
              <Switch
                checked={clientVisible}
                onCheckedChange={setClientVisible}
              />
            </div>
            <div className="flex justify-end gap-2">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
