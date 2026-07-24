import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createLicenceAudit } from "./actions";

/**
 * Drop a licence PDF → row is created, file uploaded, AI review kicked off,
 * and we navigate straight to the audit page where the live progress shows.
 */
export function ImportLicenceDialog() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (busy) return;
    setBusy(true);
    const result = await createLicenceAudit(file);
    setBusy(false);
    if (result.error || !result.id) {
      toast.error(result.error ?? "Import failed.");
      return;
    }
    setOpen(false);
    navigate(`/licence-audits/${result.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && setOpen(v)}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileUp className="size-3.5" />
          Import licence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import a licence PDF</DialogTitle>
          <DialogDescription>
            Upload the issued licence, permit or registration. The AI reads it,
            works out what it is, and builds the audit checklist from its
            conditions — verbatim, with page references.
          </DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          onClick={() => !busy && fileRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm font-medium">Uploading…</p>
              <p className="text-xs text-muted-foreground">
                Starting the AI review
              </p>
            </>
          ) : (
            <>
              <Upload className="size-6 text-muted-foreground/70" />
              <p className="text-sm font-medium">
                Drop the PDF here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Scanned or digital — up to 30 MB
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
