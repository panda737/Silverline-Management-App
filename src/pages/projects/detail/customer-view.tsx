import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClientProjectView,
  ClientProjectViewLoading,
  useClientProjectView,
} from "@/pages/portal/client-project-view";
import type { ProjectWithRelations } from "./project-detail";

/**
 * Preview of exactly what the client sees for this project in their portal.
 *
 * "Exactly" is now literal. This used to be a hand-written imitation of the
 * portal layout, fed from the staff-side project record. By 15 August 2026 the
 * two had drifted: it was still showing a completion percentage the portal no
 * longer had, and still rendering the summary, project manager and updates as
 * separate blocks the portal had stopped rendering. It showed LESS than the
 * client actually gets — not a leak, but worse in one way, because a staff
 * member opening this tab to check what the client can see was doing the right
 * thing and getting a wrong answer.
 *
 * It now renders the client portal's own component, reading the same portal_*
 * views the client reads. The only difference is readOnly: staff see the
 * controls' absence rather than being invited to confirm a fact as the client.
 */
export function CustomerView({ project }: { project: ProjectWithRelations }) {
  const { data, isPending, error } = useClientProjectView(project.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
        <Eye className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Exactly what {project.client?.company_name ?? "the client"} sees in
          their portal — the same component, reading the same client-safe views.
          Only the reply and upload controls are removed.
        </span>
      </div>

      {isPending ? (
        <ClientProjectViewLoading />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Could not load the client view: {(error as Error).message}
          </CardContent>
        </Card>
      ) : !data?.project ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nothing is client-visible on this project yet.
          </CardContent>
        </Card>
      ) : (
        <ClientProjectView data={data} readOnly />
      )}
    </div>
  );
}
