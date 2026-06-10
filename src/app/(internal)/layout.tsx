import { requireInternal } from "@/lib/auth";
import { AppHeader, AppRail } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <div className="min-h-svh">
        <AppHeader user={user} />
        <AppRail user={user} />
        <main className="pt-12 md:pl-12">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
