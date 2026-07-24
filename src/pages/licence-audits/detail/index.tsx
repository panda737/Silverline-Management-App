import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  complianceStats,
  type LicenceAuditRow,
  type LicenceChecklistItem,
  type LicenceChecklistSection,
} from "@/lib/licence-audit";
import {
  deleteLicenceAudit,
  getLicencePdfUrl,
  saveLicenceSections,
  updateLicenceAudit,
} from "../actions";
import { ProcessingView } from "./processing-view";
import { ChecklistItemRow } from "./checklist-item";
import { ReportTab } from "./report-tab";

const PROCESSING = ["uploaded", "reading", "extracting"];

function MetaField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default function LicenceAuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: audit, error } = useQuery({
    queryKey: ["licence-audit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licence_audits")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw new Error(`Failed to load audit: ${error.message}`);
      if (!data) throw new Error("Licence audit not found.");
      return data as unknown as LicenceAuditRow;
    },
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data && PROCESSING.includes(query.state.data.processing_status)
        ? 2500
        : false,
  });

  useDocumentTitle(
    audit?.metadata?.facility_name || audit?.file_name || "Licence Audit"
  );

  // Local working copy of the checklist (source of truth while editing),
  // write-through to the DB with a debounce.
  const [sections, setSections] = useState<LicenceChecklistSection[] | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = audit?.processing_status === "ready";

  useEffect(() => {
    if (ready && audit && sections === null) {
      setSections(audit.sections ?? []);
    }
  }, [ready, audit, sections]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const updateItem = useCallback(
    (sectionIndex: number, itemIndex: number, patch: Partial<LicenceChecklistItem>) => {
      setSections((prev) => {
        if (!prev) return prev;
        const next = prev.map((s, si) =>
          si !== sectionIndex
            ? s
            : {
                ...s,
                items: s.items.map((it, ii) =>
                  ii !== itemIndex ? it : { ...it, ...patch }
                ),
              }
        );
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setSaveState("saving");
        saveTimer.current = setTimeout(async () => {
          const error = await saveLicenceSections(id!, next);
          if (error) {
            toast.error(`Could not save: ${error}`);
            setSaveState("idle");
            return;
          }
          queryClient.setQueryData(
            ["licence-audit", id],
            (old: LicenceAuditRow | undefined) =>
              old ? { ...old, sections: next } : old
          );
          setSaveState("saved");
        }, 800);
        return next;
      });
    },
    [id]
  );

  // Document viewer state
  const [tab, setTab] = useState("checklist");
  const [pdfPage, setPdfPage] = useState(1);
  const { data: pdfUrl } = useQuery({
    queryKey: ["licence-pdf", id],
    queryFn: () => getLicencePdfUrl(audit!.storage_path),
    enabled: !!audit?.storage_path && ready,
    staleTime: 45 * 60 * 1000,
  });

  const viewPage = useCallback((page: number) => {
    setPdfPage(page);
    setTab("document");
  }, []);

  // Clients for the link select
  const { data: clients } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      return (data ?? []) as { id: string; company_name: string }[];
    },
  });

  if (error) throw error;
  if (!audit) return null;

  if (!ready) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/licence-audits">
            <ArrowLeft className="size-4" />
            Licence audits
          </Link>
        </Button>
        <ProcessingView audit={audit} />
      </div>
    );
  }

  const workingSections = sections ?? audit.sections ?? [];
  const stats = complianceStats(workingSections);
  const meta = audit.metadata ?? {};

  const remove = async () => {
    if (!window.confirm("Delete this licence audit and its PDF?")) return;
    const err = await deleteLicenceAudit(audit);
    if (err) {
      toast.error(err);
      return;
    }
    navigate("/licence-audits");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/licence-audits">
            <ArrowLeft className="size-4" />
            Licence audits
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "All changes saved"
                : ""}
          </span>
          <Button variant="outline" size="sm" onClick={remove}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Document identity */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-medium tracking-tight">
                {meta.facility_name || meta.licence_holder || audit.file_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {audit.doc_type_label && (
                  <Badge className="rounded-full border-primary/25 bg-primary/10 px-2 py-px text-[11px] font-medium text-primary">
                    {audit.doc_type_label}
                  </Badge>
                )}
                {meta.licence_number && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {meta.licence_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {audit.doc_summary && (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {audit.doc_summary}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <MetaField label="Licence holder" value={meta.licence_holder} />
            <MetaField label="Issuing authority" value={meta.issuing_authority} />
            <MetaField label="Issued" value={meta.issue_date} />
            <MetaField label="Review / expiry" value={meta.review_or_expiry_date} />
            <MetaField label="Location" value={meta.location} />
            <MetaField label="Sector" value={meta.sector} />
            <MetaField
              label="Pages"
              value={audit.page_count ? String(audit.page_count) : undefined}
            />
          </div>

          <div className="flex flex-wrap items-end gap-4 border-t pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Auditor</Label>
              <Input
                defaultValue={audit.auditor_name}
                placeholder="Auditor name"
                className="h-8 w-48 text-sm"
                onBlur={(e) => {
                  if (e.target.value !== audit.auditor_name) {
                    void updateLicenceAudit(audit.id, {
                      auditor_name: e.target.value,
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Audit date</Label>
              <Input
                type="date"
                defaultValue={audit.audit_date ?? ""}
                className="h-8 w-40 text-sm"
                onBlur={(e) => {
                  if ((e.target.value || null) !== audit.audit_date) {
                    void updateLicenceAudit(audit.id, {
                      audit_date: e.target.value || null,
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Client</Label>
              <Select
                value={audit.client_id ?? "none"}
                onValueChange={(v) =>
                  void updateLicenceAudit(audit.id, {
                    client_id: v === "none" ? null : v,
                  }).then(() =>
                    queryClient.invalidateQueries({
                      queryKey: ["licence-audit", id],
                    })
                  )
                }
              >
                <SelectTrigger className="h-8 w-56 text-sm">
                  <SelectValue placeholder="Link to a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {(clients ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="document">Document</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4 pt-3">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.assessed} of {stats.totalAuditable} conditions assessed
                </span>
                <span className="font-medium">
                  {stats.score !== null ? `${stats.score}% compliant` : ""}
                </span>
              </div>
              <Progress
                value={
                  stats.totalAuditable > 0
                    ? (stats.assessed / stats.totalAuditable) * 100
                    : 0
                }
              />
            </CardContent>
          </Card>

          {workingSections.map((section, si) => (
            <Card key={section.title + si} className="overflow-hidden py-0">
              <div className="border-b bg-muted/50 px-4 py-2.5">
                <h2 className="text-sm font-medium">{section.title}</h2>
              </div>
              <div className="divide-y">
                {section.items.map((item, ii) => (
                  <ChecklistItemRow
                    key={item.id + ii}
                    item={item}
                    onChange={(patch) => updateItem(si, ii, patch)}
                    onViewPage={viewPage}
                  />
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="document" className="pt-3">
          {pdfUrl ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing page {pdfPage} — click a “p. N” link on any checklist
                  item to jump here.
                </p>
                <Button asChild variant="outline" size="sm">
                  <a href={pdfUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                    Open in new tab
                  </a>
                </Button>
              </div>
              <iframe
                key={pdfPage}
                src={`${pdfUrl}#page=${pdfPage}&view=FitH`}
                title="Licence document"
                className="h-[calc(100vh-16rem)] w-full rounded-lg border bg-muted"
              />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading document…
            </p>
          )}
        </TabsContent>

        <TabsContent value="report" className="pt-3">
          <ReportTab audit={audit} sections={workingSections} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
