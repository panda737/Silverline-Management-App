import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import type { ProfileRow } from "@/lib/database.types";
import { InternalLayout } from "@/components/internal-layout";
import { PortalLayout } from "@/components/portal-layout";

/**
 * SPA auth: session state + profile query + route guards.
 *
 * Mirrors the old src/lib/auth.ts server guards exactly:
 *   requireInternal — no session → /login; !profile or !active → sign out + /login;
 *                     role client → /portal; else render
 *   requireAdmin    — requireInternal, then !admin → /dashboard
 *   requireClient   — no session → /login; !profile or !active → sign out + /login;
 *                     role !== client → /dashboard
 * RLS remains the actual security boundary — these guards are routing UX.
 */

type AuthState = { session: Session | null; loading: boolean };

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, loading: false });
      // A signed-out (or switched) user must never see the previous user's cache.
      if (event === "SIGNED_OUT") queryClient.clear();
    });
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthState {
  return useContext(AuthContext);
}

/** Current user's profile — cached; the SPA twin of the old cache(getProfile). */
export function useProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      return (data as ProfileRow | null) ?? null;
    },
  });
}

/** Full-viewport quiet loading state used while auth/profile resolve. */
function AuthPending() {
  return <div className="min-h-svh" aria-busy="true" />;
}

/** Sign out (stale/inactive session) and land on /login via full reload. */
function SignOutAndLogin() {
  useEffect(() => {
    void supabase.auth.signOut().finally(() => {
      window.location.assign("/login");
    });
  }, []);
  return <AuthPending />;
}

export function RequireInternal() {
  const { session, loading } = useSession();
  const profileQuery = useProfile();

  if (loading || (session && profileQuery.isPending)) return <AuthPending />;
  if (!session) return <Navigate to="/login" replace />;
  const profile = profileQuery.data;
  if (!profile || !profile.active) return <SignOutAndLogin />;
  if (profile.role === "client") return <Navigate to="/portal" replace />;

  return (
    <InternalLayout profile={profile}>
      <Outlet context={profile} />
    </InternalLayout>
  );
}

/** Nested inside RequireInternal — only the admin check remains. */
export function RequireAdmin() {
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  if (profileQuery.isPending) return <AuthPending />;
  if (!profile || profile.role !== "admin")
    return <Navigate to="/dashboard" replace />;
  return <Outlet context={profile} />;
}

export function RequireClient() {
  const { session, loading } = useSession();
  const profileQuery = useProfile();

  if (loading || (session && profileQuery.isPending)) return <AuthPending />;
  if (!session) return <Navigate to="/login" replace />;
  const profile = profileQuery.data;
  if (!profile || !profile.active) return <SignOutAndLogin />;
  if (profile.role !== "client") return <Navigate to="/dashboard" replace />;

  return (
    <PortalLayout profile={profile}>
      <Outlet context={profile} />
    </PortalLayout>
  );
}

/** "/" — mirror of the old RootPage: route to the role's home. */
export function RootRedirect() {
  const { session, loading } = useSession();
  const profileQuery = useProfile();

  if (loading || (session && profileQuery.isPending)) return <AuthPending />;
  if (!session) return <Navigate to="/login" replace />;
  const profile = profileQuery.data;
  if (!profile) return <SignOutAndLogin />;
  return (
    <Navigate to={profile.role === "client" ? "/portal" : "/dashboard"} replace />
  );
}

/** Old middleware behavior: a signed-in user visiting /login goes to "/". */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  if (loading) return <AuthPending />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}
