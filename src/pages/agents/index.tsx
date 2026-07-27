/**
 * Mission Control.
 *
 * One command centre per engagement, chosen from the selector. Each mission is
 * its own component because the shape of the work genuinely differs — a
 * licensing application has a statutory submission clock and a participation
 * record; an enforcement matter has a notice, representations and a standing
 * reporting obligation. Forcing both through one tab set would flatten the
 * distinction that matters most.
 *
 * Missions are static fixtures today, each built from the real file it names.
 * The registry below is the seam: when the agent fleet starts writing findings
 * to the database, a mission becomes a live read rather than a new page.
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { cn } from "@/lib/utils";
import { DilexMission, DILEX_HEADER } from "./dilex-mission";
import { ClinxMission, CLINX_HEADER } from "./clinx-mission";
import { VerdexMission, VERDEX_HEADER } from "./verdex-mission";

type Mission = {
  id: string;
  /** The project as it is named in the portal, so the two line up. */
  project: string;
  client: string;
  kind: string;
  header: { title: string; description: string; badge: string };
  render: () => React.ReactNode;
};

const MISSIONS: Mission[] = [
  {
    id: "dilex",
    project: "Dilex Inland WML Application",
    client: "Miller and Consulting",
    kind: "Licence application",
    header: DILEX_HEADER,
    render: () => <DilexMission />,
  },
  {
    id: "clinx",
    project: "ClinX – DFFE Reporting & AEL Compliance",
    client: "ClinX Medical Waste Management",
    kind: "Enforcement",
    header: CLINX_HEADER,
    render: () => <ClinxMission />,
  },
  {
    id: "verdex",
    project: "Verdex – Waste Management Licence",
    client: "Verdex (Pty) Ltd",
    kind: "S24G rectification",
    header: VERDEX_HEADER,
    render: () => <VerdexMission />,
  },
];

/** Projects that have a record in the portal but no mission built yet. Listed
 *  rather than hidden, so the selector shows the whole portfolio and it is
 *  obvious which files are being watched and which are not. */
const NOT_YET_BUILT = [
  "Spill Tech – Norms & Standards Application Gauteng",
  "Smet Jet – Secunda Hazardous Waste Facility",
  "Tshenolo – Norms & Standards Registration",
  "Dilex Randfontein – Norms & Standards",
  "Hillside Complex – Section 24G Fine Appeal",
  "Centurion Cleaning – GWIS Registration",
];

export default function AgentsPage() {
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];

  useDocumentTitle(`${mission.header.title} — ${mission.client}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mission.header.title}
        description={mission.header.description}
      >
        <Badge variant="outline" className="rounded-full">
          {mission.header.badge}
        </Badge>
      </PageHeader>

      {/* Mission selector — which engagement this command centre is showing. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-auto gap-2 py-2 text-left">
            <span className="flex flex-col items-start">
              <span className="text-[11px] text-muted-foreground">Mission</span>
              <span className="text-sm font-medium">{mission.project}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[22rem]">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Under mission control
          </DropdownMenuLabel>
          {MISSIONS.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onSelect={() => setMissionId(m.id)}
              className="flex-col items-start gap-0.5"
            >
              <span
                className={cn(
                  "text-sm",
                  m.id === mission.id && "font-medium text-foreground"
                )}
              >
                {m.project}
              </span>
              <span className="text-xs text-muted-foreground">
                {m.client} · {m.kind}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            No mission built yet
          </DropdownMenuLabel>
          {NOT_YET_BUILT.map((p) => (
            <DropdownMenuItem key={p} disabled className="text-xs">
              {p}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {mission.render()}
    </div>
  );
}
