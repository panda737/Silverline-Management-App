import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { DocReqStatusBadge } from "@/components/status-badge";
import { DOC_REQ_STATUS_KEYS, DOC_REQ_STATUS_LABELS, resolveStageName } from "@/lib/wml";
import type {
  DocReqStatus,
  ProjectDocumentRequirementRow,
  WmlRoute,
} from "@/lib/database.types";
import { setDocRequirementStatus } from "../wml-actions";

export function WmlDocuments({
  projectId,
  route,
  docReqs,
}: {
  projectId: string;
  route: WmlRoute | null;
  docReqs: ProjectDocumentRequirementRow[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Checklist of documents expected for this route, linked to timeline stages.
      </p>
      {docReqs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No documents yet — set a route to generate the checklist.
        </p>
      ) : (
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden md:table-cell">Linked stage</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
                  <TableHead className="w-40">Set status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docReqs.map((d) => (
                  <DocRow key={d.id} projectId={projectId} route={route} doc={d} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}

function DocRow({
  projectId,
  route,
  doc,
}: {
  projectId: string;
  route: WmlRoute | null;
  doc: ProjectDocumentRequirementRow;
}) {
  const [pending, start] = useTransition();
  const [naOpen, setNaOpen] = useState(false);

  function change(status: DocReqStatus) {
    if (status === "not_applicable") {
      setNaOpen(true);
      return;
    }
    start(async () => {
      const res = await setDocRequirementStatus(projectId, doc.id, status);
      if (!res.ok) toast.error(res.error ?? "Could not update document.");
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {doc.name}
        {doc.notes && (
          <p className="text-xs font-normal text-muted-foreground">{doc.notes}</p>
        )}
        {doc.status === "not_applicable" && doc.na_reason && (
          <p className="text-xs font-normal text-muted-foreground">N/A: {doc.na_reason}</p>
        )}
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        {resolveStageName(route, doc.linked_stage_key)}
      </TableCell>
      <TableCell className="text-muted-foreground">{doc.required ? "Yes" : "No"}</TableCell>
      <TableCell>
        <DocReqStatusBadge status={doc.status} />
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {doc.upload_date ? format(new Date(doc.upload_date), "d MMM yyyy") : "—"}
      </TableCell>
      <TableCell>
        <Select value={doc.status} onValueChange={(v) => change(v as DocReqStatus)} disabled={pending}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_REQ_STATUS_KEYS.map((s) => (
              <SelectItem key={s} value={s}>
                {DOC_REQ_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NaDialog
          open={naOpen}
          onOpenChange={setNaOpen}
          projectId={projectId}
          docId={doc.id}
          defaultReason={doc.na_reason ?? ""}
        />
      </TableCell>
    </TableRow>
  );
}

function NaDialog({
  open,
  onOpenChange,
  projectId,
  docId,
  defaultReason,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  docId: string;
  defaultReason: string;
}) {
  const [reason, setReason] = useState(defaultReason);
  const [pending, start] = useTransition();

  function save() {
    if (!reason.trim()) {
      toast.error("A reason is required.");
      return;
    }
    start(async () => {
      const res = await setDocRequirementStatus(projectId, docId, "not_applicable", reason);
      if (res.ok) {
        toast.success("Marked Not Applicable.");
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "Could not update document.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Not Applicable</DialogTitle>
          <DialogDescription>
            Give a reason this document is not applicable to this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`na_${docId}`}>Reason</Label>
          <Textarea
            id={`na_${docId}`}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter showCloseButton>
          <Button size="sm" onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
