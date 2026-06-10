import { requireInternal } from "@/lib/auth";
import { AppSidebar, MobileHeader } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireInternal();
  const user = {
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
  };

  return (
    <div className="min-h-svh">
      <AppSidebar user={user} />
      <MobileHeader user={user} />
      <div className="lg:pl-60">
        <div className="hidden items-center justify-end border-b px-6 py-2 lg:flex">
          <ThemeToggle />
        </div>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
