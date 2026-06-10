import type { Metadata } from "next";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { USER_ROLE_LABELS } from "@/lib/labels";
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

const ROLE_BADGE: Record<UserRole, string> = {
  admin:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-transparent",
  staff:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-transparent",
  client:
    "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-transparent",
};

export default async function UsersPage() {
  const me = await requireAdmin();
  const supabase = await createClient();

  const [{ data: usersData, error }, { data: clients }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, active, created_at, client:clients(company_name)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, company_name").order("company_name"),
  ]);
  if (error) throw new Error(`Failed to load users: ${error.message}`);

  const users = (usersData ?? []) as unknown as UserRowData[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Staff and client portal accounts. All accounts are invite-only.
          </p>
        </div>
        <InviteDialog
          clients={(clients ?? []).map((c) => ({
            id: c.id,
            label: c.company_name,
          }))}
        />
      </div>

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
                  <Badge className={ROLE_BADGE[u.role]}>
                    {USER_ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {u.client?.company_name ?? "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {format(new Date(u.created_at), "d MMM yyyy")}
                </TableCell>
                <TableCell>
                  {u.active ? (
                    <Badge className="border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">Deactivated</Badge>
                  )}
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
