import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Pieces shared by every mission. Both the Dilex and ClinX fixtures produce the
 * same finding shape — an agent, a severity, what it found, what it proposes and
 * the evidence behind it — so the rendering is written once against that shape
 * rather than per project.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type MissionFinding = {
  agent: string;
  severity: Severity;
  title: string;
  detail: string;
  action: string;
  evidence: { source: string; locator: string; quote: string }[];
};

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
  medium: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-400",
  low: "bg-muted text-muted-foreground border-border",
  info: "bg-muted text-muted-foreground border-border",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-px text-[11px] font-medium capitalize",
        SEVERITY_STYLES[severity]
      )}
    >
      {severity}
    </span>
  );
}

export function Stat({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone?: "bad" | "warn" | "good";
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-2xl font-medium tabular-nums",
            tone === "bad" && "text-destructive",
            tone === "warn" && "text-amber-600 dark:text-amber-400",
            tone === "good" && "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {value}
        </p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}

export function FindingCard({ finding }: { finding: MissionFinding }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <SeverityBadge severity={finding.severity} />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium leading-snug">{finding.title}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {finding.agent}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {finding.detail}
        </p>
        <div className="rounded-md border border-dashed bg-muted/40 p-3">
          <p className="text-xs font-medium">Proposed action</p>
          <p className="mt-1 text-sm text-muted-foreground">{finding.action}</p>
        </div>
        <details className="group">
          <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground">
            Evidence ({finding.evidence.length}) ▾
          </summary>
          <ul className="mt-2 space-y-2 border-l pl-3">
            {finding.evidence.map((e, i) => (
              <li key={i} className="text-xs">
                <span className="font-medium">{e.source}</span>
                {e.locator && (
                  <span className="text-muted-foreground"> · {e.locator}</span>
                )}
                {e.quote && (
                  <p className="mt-0.5 italic text-muted-foreground">
                    “{e.quote}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}

/** Whole-number days between two ISO dates. Negative means the date has passed. */
export function daysBetween(from: string, to: string) {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000
  );
}
