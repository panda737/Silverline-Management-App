import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  RequireAdmin,
  RequireClient,
  RequireClientId,
  RequireInternal,
  RedirectIfAuthed,
  RootRedirect,
} from "@/lib/auth";
import LoginPage from "@/pages/login";
import AuthConfirmPage from "@/pages/auth/confirm";
import SetPasswordPage from "@/pages/auth/set-password";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import NewProjectPage from "@/pages/projects/new";
import ProjectDetailPage from "@/pages/projects/detail";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/clients/detail";
import TasksPage from "@/pages/tasks";
import DocumentsPage from "@/pages/documents";
import ReviewsPage from "@/pages/reviews";
import ReviewDetailPage from "@/pages/reviews/detail";
import LicenceAuditsPage from "@/pages/licence-audits";
import LicenceAuditDetailPage from "@/pages/licence-audits/detail";
import LicenceAuditReportPage from "@/pages/licence-audits/report";
import ChatPage from "@/pages/chat";
/*
  Mission Control is LAZY on purpose, and it is the one route where that is not
  a performance decision.

  Its fixtures carry Silverline's own working analysis — the section 24G fine
  exposure, which arguments we think will hold, corrections to our own record.
  Every other page is imported eagerly, which put all of that in the single
  1.8 MB bundle that every signed-in browser downloads, client browsers
  included. RequireInternal decides what RENDERS; it has never decided what
  ships. So a client with a login could read the internal file in devtools
  without ever visiting the page.

  Splitting it out means the chunk is only fetched when an internal user opens
  the route. That is defence in depth, NOT access control — the chunk is still
  served to anyone who requests its URL. The real fix is to move this content
  into Supabase behind RLS, as the rest of the portal already is. Until then,
  do not make this import eager again, and do not import these fixtures from
  any page a client can reach.
*/
const AgentsPage = lazy(() => import("@/pages/agents"));
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import PortalDashboardPage from "@/pages/portal";
import PortalProjectPage from "@/pages/portal/project";
import PortalVerdexPage from "@/pages/portal/verdex";
import PortalDilexPage from "@/pages/portal/dilex";
import { VERDEX_CLIENT_ID } from "@/lib/demo/verdex-client";
import { DILEX_CLIENT_ID } from "@/lib/demo/dilex-client";

function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <p className="text-sm text-muted-foreground">Page not found.</p>
      <Link to="/" className="text-sm text-primary underline">
        Go home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route path="/auth/confirm" element={<AuthConfirmPage />} />
        <Route path="/auth/set-password" element={<SetPasswordPage />} />

        {/* Internal shell — mirror of the (internal) route group */}
        <Route element={<RequireInternal />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:id" element={<ReviewDetailPage />} />
          <Route path="/licence-audits" element={<LicenceAuditsPage />} />
          <Route path="/licence-audits/:id" element={<LicenceAuditDetailPage />} />
          <Route
            path="/licence-audits/:id/report"
            element={<LicenceAuditReportPage />}
          />
          <Route path="/chat" element={<ChatPage />} />
          <Route
            path="/agents"
            element={
              <Suspense
                fallback={
                  <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
                }
              >
                <AgentsPage />
              </Suspense>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        {/* Client portal */}
        <Route element={<RequireClient />}>
          <Route path="/portal" element={<PortalDashboardPage />} />
          <Route path="/portal/projects/:id" element={<PortalProjectPage />} />
          {/*
            Hand-built pages for one engagement each, because the generic portal
            reads project stages and these are applications with a shape of
            their own. They render written fixtures, so unlike the rest of the
            portal there is no RLS behind them — see the note in the *-client.ts
            files.

            THAT IS WHY EACH IS WRAPPED IN RequireClientId. RequireClient only
            asks "is this a client?", which is enough where RLS scopes the rows
            to the caller and is not enough here: without the wrapper, any
            client login reaches every one of these pages.
          */}
          <Route
            path="/portal/verdex"
            element={
              <RequireClientId clientId={VERDEX_CLIENT_ID}>
                <PortalVerdexPage />
              </RequireClientId>
            }
          />
          <Route
            path="/portal/dilex"
            element={
              <RequireClientId clientId={DILEX_CLIENT_ID}>
                <PortalDilexPage />
              </RequireClientId>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
