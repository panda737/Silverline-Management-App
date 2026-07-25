import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppHeader } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ProfileRow } from "@/lib/database.types";

/** Port of src/app/(internal)/layout.tsx — shell geometry unchanged. */
export function InternalLayout({
  profile,
  children,
}: {
  profile: ProfileRow;
  children: ReactNode;
}) {
  const user = {
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
  };
  const { pathname } = useLocation();

  return (
    <TooltipProvider>
      <div className="min-h-svh">
        <AppHeader user={user} />
        <main className="pt-12">
          <div className="mx-auto w-full max-w-[90rem] px-4 py-6 md:px-6">
            <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
