import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarDays, FolderKanban, MessageSquare, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/lib/labels";
import type {
  PortalProjectRow,
  PortalTimelineItemRow,
  PortalUpdateRow,
} from "@/lib/database.types";

export const metadata: Metadata = { title: "Client Portal" };

function fmtDate(d: string | null) {
  return d ? format(new Date(d), "d MMMM yyyy") : null;
}

export default async function PortalDashboardPage() {
  const profile = await requireClient();
  const supabase = await createClient();

  const [{ data: companyData }, { data: projectsData }, { data: updatesData }] =
    await Promise.all([
      supabase.from("portal_company").select("company_name").maybeSingle(),
      supabase
        .from("portal_projects")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("portal_updates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const projects = (projectsData ?? []) as PortalProjectRow[];
  const updates = (updatesData ?? []) as PortalUpdateRow[];

  // Current (first non-completed) client-visible stage per project.
  const projectIds = projects.map((p) => p.id);
  let stagesByProject = new Map<string, PortalTimelineItemRow[]>();
  if (projectIds.length > 0) {
    const { data: stagesData } = await supabase
      .from("portal_timeline_items")
      .select("*")
      .in("project_id", projectIds)
      .order("sort_order");
    const stages = (stagesData ?? []) as PortalTimelineItemRow[];
    stagesByProject = stages.reduce((map, s) => {
      const list = map.get(s.project_id) ?? [];
      list.push(s);
      map.set(s.project_id, list);
      return map;
    }, new Map<string, PortalTimelineItemRow[]>());
  }

  const activeProjects = projects.filter(
    (p) => !["completed", "cancelled"].includes(p.status)
  );

  return (
    <div className="space-y-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-medium tracking-tight">
          Welcome, {profile.full_name.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {companyData?.company_name
            ? `${companyData.company_name} — your projects with Silverline at a glance.`
            : "Your projects with Silverline at a glance."}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <FolderKanban className="size-4 text-primary" />
          Your projects
        </h2>
        {activeProjects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              You have no active projects at the moment. Completed projects
              will continue to appear here for reference.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeProjects.map((p) => {
              const stages = stagesByProject.get(p.id) ?? [];
              const currentStage = stages.find(
                (s) => s.status !== "completed" && s.status !== "skipped"
              );
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">
                        {p.name}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {PROJECT_STATUS_LABELS[p.status]}
                      </Badge>
                    </div>
                    <CardDescription>
                      {PROJECT_TYPE_LABELS[p.project_type]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium tabular-nums">
                          {p.progress}%
                        </span>
                      </div>
                      <Progress value={p.progress} className="h-2" />
                    </div>
                    {currentStage && (
                      <div className="rounded-lg bg-accent px-3 py-2.5">
                        <p className="text-xs font-medium text-accent-foreground/70 uppercase tracking-wide">
                          Current stage
                        </p>
                        <p className="text-sm font-medium text-accent-foreground">
                          {currentStage.stage_name}
                        </p>
                      </div>
                    )}
                    {p.client_summary && (
                      <p className="text-sm text-muted-foreground">
                        {p.client_summary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      {p.manager_name && (
                        <span className="flex items-center gap-1.5">
                          <UserRound className="size-3.5" />
                          {p.manager_name}
                        </span>
                      )}
                      {p.target_date && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          Target: {fmtDate(p.target_date)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="size-4 text-primary" />
          Latest updates
        </h2>
        {updates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No updates yet. Your Silverline team will post progress updates
              here.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y pt-6">
              {updates.map((u) => (
                <div key={u.id} className="space-y-1 py-4 first:pt-0 last:pb-0">
                  <p className="text-sm">{u.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.project_name} · {u.author_name ?? "Silverline"} ·{" "}
                    {format(new Date(u.created_at), "d MMM yyyy")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
