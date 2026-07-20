import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  CheckSquare,
  ChevronRight,
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

function sectionLabel(pathname: string) {
  const all = [...NAV_ITEMS, ...FOOTER_ITEMS];
  const match = all.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );
  return match?.label ?? null;
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.href}
      className={cn(
        "flex h-9 items-center rounded-md transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center">
        <item.icon className="size-[18px]" />
      </span>
      <span className="whitespace-nowrap pr-3 text-sm font-medium opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100">
        {item.label}
      </span>
    </Link>
  );
}

/**
 * Slim icon rail (desktop only) that smoothly expands to reveal labels on
 * hover, then collapses back to icons when the pointer leaves.
 */
export function AppRail({ user }: { user: ShellUser }) {
  const { pathname } = useLocation();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="group/rail fixed inset-y-0 top-12 left-0 z-30 hidden w-12 flex-col justify-between overflow-hidden border-r border-sidebar-border bg-sidebar py-2 transition-[width] duration-300 ease-in-out hover:w-48 hover:shadow-xl md:flex">
      <nav className="flex flex-col gap-1 px-1.5">
        {visibleItems(user).map((item) => (
          <RailLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>
      <nav className="flex flex-col gap-1 px-1.5">
        {FOOTER_ITEMS.map((item) => (
          <RailLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>
    </aside>
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

/** Slim top header: brand, breadcrumb, theme + account controls. */
export function AppHeader({ user }: { user: ShellUser }) {
  const { pathname } = useLocation();
  const section = sectionLabel(pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b bg-background px-3">
      <MobileNav user={user} />
      <Link to="/dashboard" className="flex items-center gap-2">
        <BrandMark className="size-6" />
        <span className="text-[13px] font-medium">Silverline</span>
      </Link>
      {section && (
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          {section}
        </span>
      )}
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
