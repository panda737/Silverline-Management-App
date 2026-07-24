import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, ClipboardCheck, Loader2 } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  complianceStats,
  LICENCE_DOC_TYPE_LABELS,
  type LicenceAuditRow,
} from "@/lib/licence-audit";
import { ImportLicenceDialog } from "./import-dialog";

type AuditListRow = LicenceAuditRow & {
  client: { company_name: string } | null;
};

const PROCESSING = ["uploaded", "reading", "extracting"];

function StatusCell({ audit }: { audit: AuditListRow }) {
  if (PROCESSING.includes(audit.processing_status)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        AI processing…
      </span>
    );
  }
  if (audit.processing_status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <AlertTriangle className="size-3" />
        Failed
      </span>
    );
  }
  const stats = complianceStats(audit.sections ?? []);
  if (stats.assessed === 0) {
    return (
      <Badge
        variant="outline"
        className="rounded-full px-2 py-px text-[11px] font-medium text-muted-foreground"
      >
        Ready to audit
      </Badge>
    );
  }
  const done = audit.audit_status === "completed";
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          "text-xs font-medium " +
          (stats.score !== null && stats.score >= 80
            ? "text-emerald-600 dark:text-emerald-400"
            : stats.score !== null && stats.score >= 50
              ? "text-amber-600 dark:text-amber-400"
              : "text-destructive")
        }
      >
        {stats.score ?? "—"}%
      </span>
      <span className="text-xs text-muted-foreground">
        {done
          ? "Complete"
          : `${stats.assessed}/${stats.totalAuditable} assessed`}
      </span>
    </div>
  );
}

export default function LicenceAuditsPage() {
  useDocumentTitle("Licence Audits");

  const { data, error } = useQuery({
    queryKey: ["licence-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licence_audits")
        .select("*, client:clients(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Failed to load licence audits: ${error.message}`);
      return (data ?? []) as unknown as AuditListRow[];
    },
    refetchInterval: (query) =>
      (query.state.data ?? []).some((a) =>
        PROCESSING.includes(a.processing_status)
      )
        ? 3000
        : false,
  });
  if (error) throw error;
  if (!data) return null;

  const audits = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licence Audits"
        description="Internal tool — upload an issued licence, let the AI extract its conditions, conduct the audit, and generate the external report."
      >
        <ImportLicenceDialog />
      </PageHeader>

      {audits.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No licence audits yet"
          description="Import a licence PDF and the AI will identify the document, extract every condition verbatim, and build the audit checklist."
        >
          <ImportLicenceDialog />
        </EmptyState>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility / document</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="max-w-80">
                    <Link
                      to={`/licence-audits/${audit.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {audit.metadata?.facility_name ||
                        audit.metadata?.licence_holder ||
                        audit.file_name}
                    </Link>
                    {audit.metadata?.licence_number && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {audit.metadata.licence_number}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-56 md:table-cell">
                    {audit.doc_type ? (
                      <span
                        className="block truncate text-muted-foreground"
                        title={audit.doc_type_label ?? undefined}
                      >
                        {LICENCE_DOC_TYPE_LABELS[audit.doc_type] ??
                          audit.doc_type_label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {audit.client?.company_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusCell audit={audit} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {format(new Date(audit.created_at), "d MMM yyyy")}
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
