import Link from "next/link";
import { Leaf, LogOut } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
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

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireClient();
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("portal_company")
    .select("company_name")
    .maybeSingle();

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3 lg:px-8">
          <Link href="/portal" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Silverline</p>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Client Portal
              </p>
            </div>
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
        {children}
      </main>
      <footer className="border-t bg-background py-4">
        <p className="mx-auto w-full max-w-5xl px-4 text-xs text-muted-foreground lg:px-8">
          Silverline Environmental Consulting — Client Portal
        </p>
      </footer>
    </div>
  );
}
