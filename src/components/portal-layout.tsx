import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Leaf, LogOut } from "lucide-react";
import { initials } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/pages/login/actions";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileRow } from "@/lib/database.types";

/** Port of src/app/portal/layout.tsx — company name comes from the portal view. */
export function PortalLayout({
  profile,
  children,
}: {
  profile: ProfileRow;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const { data: company } = useQuery({
    queryKey: ["portal", "company"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portal_company")
        .select("company_name")
        .maybeSingle();
      return data ?? null;
    },
  });

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-4 px-4 lg:px-8">
          <Link to="/portal" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="size-3.5" />
            </span>
            <span className="text-[13px] font-medium">Silverline</span>
            <span className="text-[13px] text-muted-foreground">
              · Client Portal
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {initials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {profile.full_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {company?.company_name ?? profile.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOut}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 lg:px-8">
        <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
      </main>
      <footer className="border-t bg-background py-4">
        <p className="mx-auto w-full max-w-5xl px-4 text-xs text-muted-foreground lg:px-8">
          Silverline Environmental Consulting — Client Portal
        </p>
      </footer>
    </div>
  );
}
