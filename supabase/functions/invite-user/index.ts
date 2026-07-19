// invite-user — the ONE service-role operation the SPA cannot do in the browser.
//
// Port of the invite half of src/app/(internal)/users/actions.ts. The caller's
// JWT is verified, their profile must be an active admin, then the GoTrue Admin
// API sends the invite and stamps role/client_id into app_metadata (the
// admin-controlled source of truth; DB triggers sync it into profiles).
//
// Secrets: SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
// auto-injected by the platform. Set SITE_URL manually:
//   supabase secrets set SITE_URL=https://<prod-domain>
// Deploy:
//   supabase functions deploy invite-user
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;

  // 1. Identify the caller from their JWT (RLS-scoped client).
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await caller.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  // Only active admins may invite users — same rule as the old server action.
  const { data: profile } = await caller
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin" || !profile.active) {
    return json({ error: "Only admins can invite users." }, 403);
  }

  // 2. Validate body (the client already ran the zod schema; re-check the
  //    invariants that matter server-side).
  let body: {
    full_name?: string;
    email?: string;
    role?: string;
    client_id?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const full_name = (body.full_name ?? "").trim();
  const email = (body.email ?? "").trim();
  const role = body.role;
  const client_id = body.client_id || null;

  if (full_name.length < 2) return json({ error: "Enter the person's name" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ error: "Enter a valid email address" }, 400);
  if (!["admin", "staff", "client"].includes(role ?? ""))
    return json({ error: "Invalid role" }, 400);
  if (role === "client" && !client_id)
    return json({ error: "Client users must be linked to a client company" }, 400);

  // 3. Service-role invite + app_metadata stamp (verbatim from the old action).
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, user_role: role, client_id },
    redirectTo: `${siteUrl}/auth/set-password`,
  });
  if (error) return json({ error: `Invite failed: ${error.message}` }, 400);

  // Also stamp role into app_metadata (not editable by the user).
  if (data.user) {
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { user_role: role, client_id },
    });
  }

  return json({ success: `Invitation sent to ${email}` });
});
