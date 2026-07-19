import { Link, useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ClientDialog } from "./client-dialog";
import { ClientsSearch } from "./clients-search";

export default function ClientsPage() {
  useDocumentTitle("Clients");
  const { data: profile } = useProfile();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? undefined;

  const { data, error } = useQuery({
    queryKey: ["clients", { q }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("id, company_name, industry, created_at")
        .order("company_name");
      if (q) query = query.ilike("company_name", `%${q}%`);

      const [{ data: clientsData, error }, { data: projectRows }] =
        await Promise.all([query, supabase.from("projects").select("client_id")]);
      if (error) throw new Error(`Failed to load clients: ${error.message}`);

      return { clients: clientsData ?? [], projectRows: projectRows ?? [] };
    },
  });
  if (error) throw error;
  if (!data || !profile) return null;

  const projectCounts = new Map<string, number>();
  for (const row of data.projectRows) {
    projectCounts.set(row.client_id, (projectCounts.get(row.client_id) ?? 0) + 1);
  }
  const clients = data.clients;
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Client companies and their projects.">
        {isAdmin && <ClientDialog />}
      </PageHeader>

      <ClientsSearch />

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={q ? "No clients match your search" : "No clients yet"}
          description={
            q
              ? "Try a different search term."
              : isAdmin
                ? "Add your first client company to start creating projects for them."
                : "An admin can add client companies."
          }
        >
          {!q && isAdmin && <ClientDialog />}
        </EmptyState>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className="hidden sm:table-cell">Industry</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/clients/${c.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {c.company_name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {c.industry ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {projectCounts.get(c.id) ?? 0}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {format(new Date(c.created_at), "d MMM yyyy")}
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
