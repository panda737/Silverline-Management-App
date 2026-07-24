import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  RequireAdmin,
  RequireClient,
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
import LicenceAuditsPage from "@/pages/licence-audits";
import LicenceAuditDetailPage from "@/pages/licence-audits/detail";
import LicenceAuditReportPage from "@/pages/licence-audits/report";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import PortalDashboardPage from "@/pages/portal";
import PortalProjectPage from "@/pages/portal/project";

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
          <Route path="/licence-audits" element={<LicenceAuditsPage />} />
          <Route path="/licence-audits/:id" element={<LicenceAuditDetailPage />} />
          <Route
            path="/licence-audits/:id/report"
            element={<LicenceAuditReportPage />}
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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
