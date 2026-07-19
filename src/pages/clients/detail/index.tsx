import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderKanban, Mail, Phone, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status-badge";
import { PROJECT_TYPE_LABELS } from "@/lib/labels";
import { ContactDialog } from "./contact-dialog";
import type {
  ClientContactRow,
  ProjectStatus,
  ProjectType,
} from "@/lib/database.types";

type ProjectLite = {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  progress: number;
};

type PortalUser = {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile } = useProfile();

  const { data, error } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const [
        { data: client, error },
        { data: contacts },
        { data: projects },
        { data: portalUsers },
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, industry, address, notes")
          .eq("id", id!)
          .maybeSingle(),
        supabase
          .from("client_contacts")
          .select("*")
          .eq("client_id", id!)
          .order("is_primary", { ascending: false }),
        supabase
          .from("projects")
          .select("id, name, project_type, status, progress")
          .eq("client_id", id!)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, full_name, email, active")
          .eq("client_id", id!)
          .eq("role", "client"),
      ]);

      if (error) throw new Error(`Failed to load client: ${error.message}`);

      return { client, contacts, projects, portalUsers };
    },
  });

  // The old page exported no metadata title — fall back to the layout default.
  useDocumentTitle();

  if (error) throw error;
  if (!data || !profile) return null;

  const { client } = data;
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm text-muted-foreground">Client not found</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/clients">
            <ArrowLeft className="size-3.5" />
            Clients
          </Link>
        </Button>
      </div>
    );
  }

  const contactList = (data.contacts ?? []) as ClientContactRow[];
  const projectList = (data.projects ?? []) as ProjectLite[];
  const userList = (data.portalUsers ?? []) as PortalUser[];
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/clients">
            <ArrowLeft className="size-3.5" />
            Clients
          </Link>
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-xl font-medium tracking-tight">
            {client.company_name}
          </h1>
          {client.industry && (
            <p className="text-sm text-muted-foreground">{client.industry}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projectList.length === 0 ? (
                <div className="flex items-center justify-between gap-3 py-2">
                  <p className="text-sm text-muted-foreground">
                    No projects for this client yet.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/projects/new">
                      <FolderKanban className="size-3.5" />
                      New project
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y">
                  {projectList.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/projects/${p.id}`}
                          className="block truncate text-sm font-medium hover:text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {PROJECT_TYPE_LABELS[p.project_type]}
                        </p>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                      <div className="hidden w-28 items-center gap-2 sm:flex">
                        <Progress value={p.progress} className="h-1.5" />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {p.progress}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">Contacts</CardTitle>
              {isAdmin && <ContactDialog clientId={client.id} />}
            </CardHeader>
            <CardContent>
              {contactList.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No contacts recorded yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {contactList.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                      <div className="min-w-40">
                        <p className="text-sm font-medium">
                          {c.name}
                          {c.is_primary && (
                            <span className="ml-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 text-[11px] leading-[18px] font-medium text-emerald-700 dark:text-emerald-400">
                              Primary
                            </span>
                          )}
                        </p>
                        {c.role_title && (
                          <p className="text-xs text-muted-foreground">{c.role_title}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {c.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="size-3.5" />
                            {c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3.5" />
                            {c.phone}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p>{client.industry ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p>{client.address ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Portal users</CardTitle>
              <CardDescription className="text-xs">
                Client logins for this company (invited from Users)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userList.length === 0 ? (
                <p className="py-1 text-sm text-muted-foreground">
                  No portal users yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {userList.map((u) => (
                    <li key={u.id} className="flex items-center gap-2 text-sm">
                      <UserRound className="size-4 text-muted-foreground" />
                      <span className={u.active ? "" : "text-muted-foreground line-through"}>
                        {u.full_name || u.email}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Internal notes</CardTitle>
                <CardDescription className="text-xs">
                  Never visible to the client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
