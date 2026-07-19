import type { ReactNode } from "react";
import { AppHeader, AppRail } from "@/components/app-shell";
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

  return (
    <TooltipProvider>
      <div className="min-h-svh">
        <AppHeader user={user} />
        <AppRail user={user} />
        <main className="pt-12 md:pl-48">
          <div className="w-full max-w-5xl px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
