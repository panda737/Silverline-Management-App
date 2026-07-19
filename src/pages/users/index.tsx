import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PageHeader } from "@/components/page-header";
import { InviteDialog } from "./invite-dialog";
import { UsersTabs, type UserRowData } from "./users-tabs";

export default function UsersPage() {
  useDocumentTitle("Users");
  const { data: me } = useProfile();

  const { data, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: usersData, error }, { data: clients }] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            // profiles↔clients has two FKs (client_id and clients.created_by) —
            // the embed must name which one to follow.
            "id, full_name, email, role, active, created_at, client:clients!profiles_client_id_fkey(company_name)"
          )
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("id, company_name").order("company_name"),
      ]);
      if (error) throw new Error(`Failed to load users: ${error.message}`);

      return {
        users: (usersData ?? []) as unknown as UserRowData[],
        clients: clients ?? [],
      };
    },
  });
  if (error) throw error;
  if (!data || !me) return null;

  const staffUsers = data.users.filter((u) => u.role === "admin" || u.role === "staff");
  const clientUsers = data.users.filter((u) => u.role === "client");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Staff and client portal accounts. All accounts are invite-only."
      >
        <InviteDialog
          clients={data.clients.map((c) => ({
            id: c.id,
            label: c.company_name,
          }))}
        />
      </PageHeader>

      <UsersTabs staff={staffUsers} clients={clientUsers} currentUserId={me.id} />
    </div>
  );
}
