import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  CheckSquare,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { cn, initials } from "@/lib/utils";
import { signOut } from "@/pages/login/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { USER_ROLE_LABELS } from "@/lib/labels";
import type { UserRole } from "@/lib/database.types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/licence-audits", label: "Licence Audits", icon: ClipboardCheck },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
];

const FOOTER_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export type ShellUser = {
  fullName: string;
  email: string;
  role: UserRole;
};

function visibleItems(user: ShellUser) {
  return NAV_ITEMS.filter((i) => !i.adminOnly || user.role === "admin");
}

/**
 * Horizontal nav tabs in the header (desktop). Active section gets an
 * underline indicator, GitHub-style; overflow scrolls without a scrollbar.
 */
function TopTabs({ user }: { user: ShellUser }) {
  const { pathname } = useLocation();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="ml-4 hidden h-12 items-center gap-1 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
      {visibleItems(user).map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "relative flex h-12 shrink-0 items-center px-3 text-[13px] font-medium transition-colors",
            isActive(item.href)
              ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function MobileNav({ user }: { user: ShellUser }) {
  const { pathname } = useLocation();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="md:hidden">
          <Menu className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <BrandMark className="size-6" />
            Silverline
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2">
          {[...visibleItems(user), ...FOOTER_ITEMS].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** Top header: brand, horizontal nav tabs, theme + account controls. */
export function AppHeader({ user }: { user: ShellUser }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b bg-background px-3">
      <MobileNav user={user} />
      <Link to="/dashboard" className="flex items-center gap-2">
        <BrandMark className="size-6" />
        <span className="text-[13px] font-medium">Silverline</span>
      </Link>
      <TopTabs user={user} />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user.fullName || user.email}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {user.email} · {USER_ROLE_LABELS[user.role]}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
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
    </header>
  );
}
