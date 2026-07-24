import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import {
  complianceStats,
  ITEM_STATUS_LABELS,
  nonConformances,
  PRIORITY_LABELS,
  type LicenceAuditRow,
} from "@/lib/licence-audit";

type AuditWithClient = LicenceAuditRow & {
  client: { company_name: string } | null;
};

const fmt = (d?: string | null) =>
  d ? format(new Date(d), "d MMMM yyyy") : "____________________";

/**
 * External Compliance Audit Report — print-optimised (browser print → PDF).
 * The @media print rules isolate #print-report so the app shell disappears.
 */
export default function LicenceAuditReportPage() {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle("Audit Report");

  const { data: audit, error } = useQuery({
    queryKey: ["licence-audit-report", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licence_audits")
        .select("*, client:clients(company_name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Licence audit not found.");
      return data as unknown as AuditWithClient;
    },
    enabled: !!id,
  });
  if (error) throw error;
  if (!audit) return null;

  const meta = audit.metadata ?? {};
  const sections = audit.sections ?? [];
  const stats = complianceStats(sections);
  const register = nonConformances(sections);
  const subject =
    meta.facility_name || meta.licence_holder || audit.file_name;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible; }
          #print-report {
            position: absolute; inset: 0 auto auto 0; width: 100%;
            padding: 0; margin: 0; border: none; box-shadow: none;
          }
          @page { size: A4; margin: 18mm 16mm; }
          #print-report table { page-break-inside: auto; }
          #print-report tr { page-break-inside: avoid; }
          #print-report h2 { page-break-after: avoid; }
        }
      `}</style>

      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={`/licence-audits/${audit.id}`}>
            <ArrowLeft className="size-4" />
            Back to audit
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-3.5" />
          Print / Save as PDF
        </Button>
      </div>

      <div
        id="print-report"
        className="space-y-8 rounded-lg border bg-background p-8 text-[13px] leading-relaxed print:text-black"
      >
        {/* Cover */}
        <header className="space-y-4 border-b pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Silverline Environmental Compliance
          </p>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              External Compliance Audit Report
            </h1>
            <p className="mt-1 text-base">{subject}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              ["Instrument audited", audit.doc_type_label ?? "—"],
              ["Licence / reference number", meta.licence_number ?? "—"],
              ["Licence holder", meta.licence_holder ?? "—"],
              ["Facility location", meta.location ?? "—"],
              ["Issuing authority", meta.issuing_authority ?? "—"],
              ["Date of issue", meta.issue_date ?? "—"],
              ["Client", audit.client?.company_name ?? "—"],
              ["Audit date", fmt(audit.audit_date)],
              ["Auditor", audit.auditor_name || "—"],
              ["Report date", format(new Date(), "d MMMM yyyy")],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="w-44 shrink-0 text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* 1. Scope */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Scope and methodology</h2>
          <p>
            This external compliance audit assessed the activities of{" "}
            {meta.licence_holder ?? "the licence holder"} at{" "}
            {meta.facility_name ?? "the facility"} against the conditions of{" "}
            {audit.doc_type_label ?? "the authorising instrument"}
            {meta.licence_number ? ` (${meta.licence_number})` : ""} issued by{" "}
            {meta.issuing_authority ?? "the competent authority"}. Each condition
            of the instrument was extracted verbatim and individually assessed
            through site inspection, records review and interviews with site
            personnel.
          </p>
          <p>
            Each auditable condition was rated: <strong>Compliant</strong> —
            the requirement is fully met; <strong>Partially compliant</strong>{" "}
            — the requirement is met in part or evidence is incomplete;{" "}
            <strong>Non-compliant</strong> — the requirement is not met;{" "}
            <strong>Not applicable</strong> — the requirement does not apply to
            the current operation.
          </p>
        </section>

        {/* 2. Executive summary */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Executive summary</h2>
          {audit.exec_summary ? (
            audit.exec_summary
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph, i) => <p key={i}>{paragraph}</p>)
          ) : (
            <p className="italic text-muted-foreground">
              No executive summary has been written yet — generate one on the
              audit&apos;s Report tab.
            </p>
          )}
        </section>

        {/* 3. Compliance summary */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">3. Compliance summary</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Section</th>
                <th className="px-2 py-1.5 text-center font-medium">C</th>
                <th className="px-2 py-1.5 text-center font-medium">PC</th>
                <th className="px-2 py-1.5 text-center font-medium">NC</th>
                <th className="px-2 py-1.5 text-center font-medium">N/A</th>
                <th className="px-2 py-1.5 text-center font-medium">Assessed</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => {
                const s = complianceStats([section]);
                if (s.totalAuditable === 0) return null;
                return (
                  <tr key={section.title} className="border-b">
                    <td className="py-1.5 pr-2">{section.title}</td>
                    <td className="px-2 py-1.5 text-center">{s.compliant}</td>
                    <td className="px-2 py-1.5 text-center">{s.partial}</td>
                    <td className="px-2 py-1.5 text-center">{s.nonCompliant}</td>
                    <td className="px-2 py-1.5 text-center">{s.notApplicable}</td>
                    <td className="px-2 py-1.5 text-center">
                      {s.assessed}/{s.totalAuditable}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-medium">
                <td className="py-2 pr-2">
                  Overall
                  {stats.score !== null && ` — ${stats.score}% compliance`}
                </td>
                <td className="px-2 py-2 text-center">{stats.compliant}</td>
                <td className="px-2 py-2 text-center">{stats.partial}</td>
                <td className="px-2 py-2 text-center">{stats.nonCompliant}</td>
                <td className="px-2 py-2 text-center">{stats.notApplicable}</td>
                <td className="px-2 py-2 text-center">
                  {stats.assessed}/{stats.totalAuditable}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 4. Detailed findings */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">4. Detailed findings</h2>
          {sections.map((section) => {
            const auditable = section.items.filter((i) => i.auditable);
            if (auditable.length === 0) return null;
            return (
              <div key={section.title} className="space-y-1.5">
                <h3 className="pt-2 text-sm font-semibold">{section.title}</h3>
                <table className="w-full border-collapse text-left align-top">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="w-16 py-1 pr-2 font-medium">Ref</th>
                      <th className="py-1 pr-2 font-medium">Requirement</th>
                      <th className="w-28 px-2 py-1 font-medium">Status</th>
                      <th className="w-52 py-1 pl-2 font-medium">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditable.map((item) => (
                      <tr key={item.id} className="border-b align-top">
                        <td className="py-1.5 pr-2 font-mono text-xs">
                          {item.id}
                        </td>
                        <td className="whitespace-pre-line py-1.5 pr-2 text-xs">
                          {item.requirement}
                        </td>
                        <td className="px-2 py-1.5 text-xs font-medium">
                          {item.status ? ITEM_STATUS_LABELS[item.status] : "Not assessed"}
                        </td>
                        <td className="py-1.5 pl-2 text-xs">
                          {item.observation || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        {/* 5. Corrective action plan */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold">
            5. Non-conformance register and corrective action plan
          </h2>
          {register.length === 0 ? (
            <p>
              No non-conformances were identified during this audit.
            </p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-16 py-1 pr-2 font-medium">Ref</th>
                  <th className="py-1 pr-2 font-medium">Finding</th>
                  <th className="py-1 pr-2 font-medium">Corrective action</th>
                  <th className="w-20 px-2 py-1 font-medium">Priority</th>
                  <th className="w-24 py-1 pl-2 font-medium">Target date</th>
                </tr>
              </thead>
              <tbody>
                {register.map((f) => (
                  <tr key={f.section + f.id} className="border-b align-top">
                    <td className="py-1.5 pr-2 font-mono text-xs">{f.id}</td>
                    <td className="py-1.5 pr-2 text-xs">
                      <span className="font-medium">
                        {f.status ? ITEM_STATUS_LABELS[f.status] : ""}
                      </span>
                      {f.observation ? ` — ${f.observation}` : ""}
                    </td>
                    <td className="py-1.5 pr-2 text-xs">
                      {f.correctiveAction || "—"}
                    </td>
                    <td className="px-2 py-1.5 text-xs">
                      {f.priority ? PRIORITY_LABELS[f.priority] : "—"}
                    </td>
                    <td className="py-1.5 pl-2 text-xs">
                      {f.targetDate ? fmt(f.targetDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 6. Declaration */}
        <section className="space-y-6">
          <h2 className="text-base font-semibold">6. Declaration</h2>
          <p>
            I declare that this audit was conducted independently and that the
            findings recorded in this report are, to the best of my knowledge,
            a true and accurate reflection of the compliance status of the
            facility at the time of the audit.
          </p>
          <div className="grid grid-cols-2 gap-10 pt-4">
            <div className="space-y-8">
              <div className="border-b" />
              <p className="-mt-6 text-xs text-muted-foreground">
                Auditor: {audit.auditor_name || "____________________"}
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-b" />
              <p className="-mt-6 text-xs text-muted-foreground">
                Date: {fmt(audit.audit_date)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
