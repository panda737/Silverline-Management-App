"use client";

import { format } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRole } from "@/lib/database.types";
import { setUserActive } from "./actions";

export type UserRowData = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  client: { company_name: string } | null;
};

// Mirrors the project-detail tab triggers (project-tabs.tsx) so the two stay uniform.
const TAB_TRIGGER_CLASS =
  "h-auto flex-none rounded-none px-0.5 pt-0 pb-2 text-[0.9375rem] text-muted-foreground transition-colors after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-primary after:transition-opacity hover:text-foreground data-active:text-foreground";

const TAB_CONTENT_CLASS =
  "duration-200 data-[state=active]:animate-in data-[state=active]:fade-in-0";

export function UsersTabs({
  staff,
  clients,
  currentUserId,
}: {
  staff: UserRowData[];
  clients: UserRowData[];
  currentUserId: string;
}) {
  return (
    <Tabs defaultValue="staff" className="gap-0">
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto overflow-y-hidden border-b border-border/70 px-3 pt-2.5 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList variant="line" className="h-auto gap-5 bg-transparent p-0">
            <TabsTrigger value="staff" className={TAB_TRIGGER_CLASS}>
              Staff
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {staff.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="clients" className={TAB_TRIGGER_CLASS}>
              Clients
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {clients.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="staff" className={TAB_CONTENT_CLASS}>
          <UsersTable variant="staff" users={staff} currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="clients" className={TAB_CONTENT_CLASS}>
          <UsersTable variant="clients" users={clients} currentUserId={currentUserId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function UsersTable({
  variant,
  users,
  currentUserId,
}: {
  variant: "staff" | "clients";
  users: UserRowData[];
  currentUserId: string;
}) {
  const isClients = variant === "clients";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead>{isClients ? "Company" : "Role"}</TableHead>
          <TableHead className="hidden sm:table-cell">Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-28" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
              {isClients ? "No client accounts yet." : "No staff accounts yet."}
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => (
            <TableRow key={u.id} className={!u.active ? "opacity-60" : ""}>
              <TableCell className="font-medium">
                {u.full_name || "—"}
                {u.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {u.email}
              </TableCell>
              {isClients ? (
                <TableCell className="text-muted-foreground">
                  {u.client?.company_name ?? "—"}
                </TableCell>
              ) : (
                <TableCell>
                  <UserRoleBadge role={u.role} />
                </TableCell>
              )}
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {format(new Date(u.created_at), "d MMM yyyy")}
              </TableCell>
              <TableCell>
                <ActiveBadge active={u.active} />
              </TableCell>
              <TableCell>
                {u.id !== currentUserId && (
                  <form action={setUserActive}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className={u.active ? "text-destructive hover:text-destructive" : ""}
                    >
                      {u.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </form>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
