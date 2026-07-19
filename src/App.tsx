import { BrowserRouter, Route, Routes } from "react-router-dom";
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

/** Temporary Phase-2 stub — every internal page gets its real port in Phase 3. */
function Stub({ name }: { name: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {name} — porting in progress
    </p>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="/dashboard" element={<Stub name="Dashboard" />} />
          <Route path="/projects" element={<Stub name="Projects" />} />
          <Route path="/projects/new" element={<Stub name="New project" />} />
          <Route path="/projects/:id" element={<Stub name="Project" />} />
          <Route path="/clients" element={<Stub name="Clients" />} />
          <Route path="/clients/:id" element={<Stub name="Client" />} />
          <Route path="/tasks" element={<Stub name="Tasks" />} />
          <Route path="/documents" element={<Stub name="Documents" />} />
          <Route path="/settings" element={<Stub name="Settings" />} />
          <Route element={<RequireAdmin />}>
            <Route path="/users" element={<Stub name="Users" />} />
          </Route>
        </Route>

        {/* Client portal */}
        <Route element={<RequireClient />}>
          <Route path="/portal" element={<Stub name="Client portal" />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="flex min-h-svh items-center justify-center">
              <p className="text-sm text-muted-foreground">Page not found.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
