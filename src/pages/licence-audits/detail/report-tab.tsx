import { useState } from "react";
import { Link } from "react-router-dom";
import { FileOutput, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  complianceStats,
  ITEM_STATUS_LABELS,
  nonConformances,
  PRIORITY_LABELS,
  type LicenceAuditRow,
  type LicenceChecklistSection,
} from "@/lib/licence-audit";
import { generateExecSummary, updateLicenceAudit } from "../actions";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "warn" | "bad";
}) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p
        className={
          "text-xl font-semibold " +
          (tone === "good"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "warn"
              ? "text-amber-600 dark:text-amber-400"
              : tone === "bad"
                ? "text-destructive"
                : "")
        }
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ReportTab({
  audit,
  sections,
}: {
  audit: LicenceAuditRow;
  sections: LicenceChecklistSection[];
}) {
  const [summary, setSummary] = useState(audit.exec_summary);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(audit.audit_status === "completed");

  const stats = complianceStats(sections);
  const register = nonConformances(sections);

  const generate = async () => {
    setGenerating(true);
    const result = await generateExecSummary({
      document: {
        type: audit.doc_type_label,
        licence_number: audit.metadata?.licence_number,
        licence_holder: audit.metadata?.licence_holder,
        facility: audit.metadata?.facility_name,
        issuing_authority: audit.metadata?.issuing_authority,
      },
      audit: {
        auditor: audit.auditor_name,
        date: audit.audit_date,
        counts: stats,
      },
      findings: register.map((f) => ({
        ref: f.ref,
        status: f.status,
        observation: f.observation,
        corrective_action: f.correctiveAction,
        priority: f.priority,
      })),
    });
    setGenerating(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSummary(result.summary);
    await updateLicenceAudit(audit.id, { exec_summary: result.summary });
  };

  const saveSummary = async () => {
    setSaving(true);
    const error = await updateLicenceAudit(audit.id, { exec_summary: summary });
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Executive summary saved.");
  };

  const toggleComplete = async (value: boolean) => {
    setCompleted(value);
    const error = await updateLicenceAudit(audit.id, {
      audit_status: value ? "completed" : "in_progress",
    });
    if (error) toast.error(error);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="Compliance score"
          value={stats.score !== null ? `${stats.score}%` : "—"}
          tone={
            stats.score === null
              ? undefined
              : stats.score >= 80
                ? "good"
                : stats.score >= 50
                  ? "warn"
                  : "bad"
          }
        />
        <Stat
          label="Assessed"
          value={`${stats.assessed}/${stats.totalAuditable}`}
        />
        <Stat label="Compliant" value={stats.compliant} tone="good" />
        <Stat label="Partially compliant" value={stats.partial} tone="warn" />
        <Stat label="Non-compliant" value={stats.nonCompliant} tone="bad" />
        <Stat label="Not applicable" value={stats.notApplicable} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive summary</CardTitle>
          <CardDescription>
            Written for the external report. Generate a draft from the findings,
            then edit it in your own words.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={8}
            placeholder="Generate a draft or write the executive summary here…"
            className="text-sm leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={generate}
              disabled={generating || stats.assessed === 0}
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Generate draft from findings
            </Button>
            <Button size="sm" onClick={saveSummary} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Save summary
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Non-conformance register ({register.length})
          </CardTitle>
          <CardDescription>
            Every partially compliant and non-compliant condition, with its
            corrective action — the heart of the report submitted to the DFFE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {register.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No non-conformances recorded{stats.assessed === 0 ? " yet — conduct the audit first" : ""}.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Finding
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Corrective action
                    </TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Target
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {register.map((f) => (
                    <TableRow key={f.ref + f.id}>
                      <TableCell className="font-mono text-xs">{f.id}</TableCell>
                      <TableCell>
                        <span
                          className={
                            "text-xs font-medium " +
                            (f.status === "non_compliant"
                              ? "text-destructive"
                              : "text-amber-600 dark:text-amber-400")
                          }
                        >
                          {f.status ? ITEM_STATUS_LABELS[f.status] : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-64 md:table-cell">
                        <span className="block truncate text-xs text-muted-foreground">
                          {f.observation || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-64 lg:table-cell">
                        <span className="block truncate text-xs text-muted-foreground">
                          {f.correctiveAction || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {f.priority ? PRIORITY_LABELS[f.priority] : "—"}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {f.targetDate || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <Switch checked={completed} onCheckedChange={toggleComplete} />
            <div>
              <Label className="text-sm">Audit complete</Label>
              <p className="text-xs text-muted-foreground">
                Mark when the assessment is final.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to={`/licence-audits/${audit.id}/report`}>
              <FileOutput className="size-4" />
              Open DFFE report
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
