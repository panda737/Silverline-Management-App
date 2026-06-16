import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { InviteDialog } from "./invite-dialog";
import { UsersTabs, type UserRowData } from "./users-tabs";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireAdmin();
  const supabase = await createClient();

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

  const users = (usersData ?? []) as unknown as UserRowData[];
  const staffUsers = users.filter((u) => u.role === "admin" || u.role === "staff");
  const clientUsers = users.filter((u) => u.role === "client");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Staff and client portal accounts. All accounts are invite-only."
      >
        <InviteDialog
          clients={(clients ?? []).map((c) => ({
            id: c.id,
            label: c.company_name,
          }))}
        />
      </PageHeader>

      <UsersTabs staff={staffUsers} clients={clientUsers} currentUserId={me.id} />
    </div>
  );
}
