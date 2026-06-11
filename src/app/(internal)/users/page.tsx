import type { Metadata } from "next";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ActiveBadge, UserRoleBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { InviteDialog } from "./invite-dialog";
import { setUserActive } from "./actions";
import type { UserRole } from "@/lib/database.types";

export const metadata: Metadata = { title: "Users" };

type UserRowData = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  client: { company_name: string } | null;
};

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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden lg:table-cell">Company</TableHead>
              <TableHead className="hidden sm:table-cell">Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className={!u.active ? "opacity-60" : ""}>
                <TableCell className="font-medium">
                  {u.full_name || "—"}
                  {u.id === me.id && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {u.email}
                </TableCell>
                <TableCell>
                  <UserRoleBadge role={u.role} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {u.client?.company_name ?? "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {format(new Date(u.created_at), "d MMM yyyy")}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={u.active} />
                </TableCell>
                <TableCell>
                  {u.id !== me.id && (
                    <form action={setUserActive}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={u.active ? "false" : "true"}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className={
                          u.active
                            ? "text-destructive hover:text-destructive"
                            : ""
                        }
                      >
                        {u.active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
