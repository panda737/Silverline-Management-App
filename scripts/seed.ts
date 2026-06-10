/**
 * Seed script for the Silverline Management Portal.
 *
 * Creates (idempotently):
 *  - 1 admin, 2 staff users
 *  - 1 client company with 2 contacts and 2 portal (client) users
 *  - 2 sample projects with template-generated timelines, tasks and updates
 *
 * Run with: npm run seed   (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Password123!";

type SeedUser = {
  email: string;
  fullName: string;
  role: "admin" | "staff" | "client";
  clientId?: string;
};

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await db
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(`profiles lookup failed for ${email}: ${error.message}`);
  return data?.id ?? null;
}

async function ensureUser(u: SeedUser): Promise<string> {
  const existing = await findUserIdByEmail(u.email);
  if (existing) {
    console.log(`  = user exists: ${u.email}`);
    return existing;
  }
  const { data, error } = await db.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.fullName },
    app_metadata: { user_role: u.role, client_id: u.clientId ?? null },
  });
  if (error || !data.user) {
    throw new Error(`createUser failed for ${u.email}: ${error?.message}`);
  }
  // The handle_new_user trigger created the profile; make sure name/role stuck.
  const { error: upErr } = await db
    .from("profiles")
    .update({
      full_name: u.fullName,
      role: u.role,
      client_id: u.clientId ?? null,
    })
    .eq("id", data.user.id);
  if (upErr) throw new Error(`profile update failed for ${u.email}: ${upErr.message}`);
  console.log(`  + created user: ${u.email} (${u.role})`);
  return data.user.id;
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding Silverline Management Portal…");

  // --- internal users --------------------------------------------------------
  console.log("Users:");
  const adminId = await ensureUser({
    email: "admin@silverline.test",
    fullName: "Juandre Cross",
    role: "admin",
  });
  const staff1Id = await ensureUser({
    email: "staff1@silverline.test",
    fullName: "Pieter van der Merwe",
    role: "staff",
  });
  const staff2Id = await ensureUser({
    email: "staff2@silverline.test",
    fullName: "Thandi Nkosi",
    role: "staff",
  });

  // --- client company --------------------------------------------------------
  console.log("Client company:");
  let clientId: string;
  {
    const { data: existing } = await db
      .from("clients")
      .select("id")
      .eq("company_name", "Vaal Industrial Recyclers (Pty) Ltd")
      .maybeSingle();
    if (existing) {
      clientId = existing.id;
      console.log("  = company exists");
    } else {
      const { data, error } = await db
        .from("clients")
        .insert({
          company_name: "Vaal Industrial Recyclers (Pty) Ltd",
          industry: "Industrial waste recycling",
          address: "14 Steel Road, Vanderbijlpark, Gauteng",
          notes: "Long-standing client. Prefers email contact. Annual audit every Q3.",
          created_by: adminId,
        })
        .select("id")
        .single();
      if (error) throw new Error(`client insert failed: ${error.message}`);
      clientId = data.id;
      console.log("  + created Vaal Industrial Recyclers (Pty) Ltd");

      const { error: contactErr } = await db.from("client_contacts").insert([
        {
          client_id: clientId,
          name: "Johan Botha",
          email: "johan@vaalrecyclers.test",
          phone: "+27 82 555 0101",
          role_title: "Operations Director",
          is_primary: true,
        },
        {
          client_id: clientId,
          name: "Lerato Dlamini",
          email: "lerato@vaalrecyclers.test",
          phone: "+27 83 555 0102",
          role_title: "SHEQ Manager",
          is_primary: false,
        },
      ]);
      if (contactErr) throw new Error(`contacts insert failed: ${contactErr.message}`);
      console.log("  + added 2 contacts");
    }
  }

  // --- client portal users ----------------------------------------------------
  console.log("Portal users:");
  await ensureUser({
    email: "client1@vaalrecyclers.test",
    fullName: "Johan Botha",
    role: "client",
    clientId,
  });
  await ensureUser({
    email: "client2@vaalrecyclers.test",
    fullName: "Lerato Dlamini",
    role: "client",
    clientId,
  });

  // --- projects ----------------------------------------------------------------
  console.log("Projects:");

  async function ensureProject(opts: {
    name: string;
    projectType: string;
    status: string;
    priority: string;
    managerId: string;
    startDaysAgo: number;
    targetDaysAhead: number;
    description: string;
    clientSummary: string;
    completedStages: number;
    inProgressStages: number;
  }): Promise<string | null> {
    const { data: existing } = await db
      .from("projects")
      .select("id")
      .eq("name", opts.name)
      .maybeSingle();
    if (existing) {
      console.log(`  = project exists: ${opts.name}`);
      return null;
    }

    const { data: project, error } = await db
      .from("projects")
      .insert({
        name: opts.name,
        client_id: clientId,
        project_type: opts.projectType,
        status: opts.status,
        priority: opts.priority,
        manager_id: opts.managerId,
        start_date: isoDaysFromNow(-opts.startDaysAgo),
        target_date: isoDaysFromNow(opts.targetDaysAhead),
        description: opts.description,
        client_summary: opts.clientSummary,
        created_by: adminId,
      })
      .select("id")
      .single();
    if (error) throw new Error(`project insert failed: ${error.message}`);
    const projectId = project.id;

    // Generate the timeline from the template for this project type.
    const { data: template, error: tplErr } = await db
      .from("timeline_templates")
      .select("stage_name, description, sort_order, default_client_visible")
      .eq("project_type", opts.projectType)
      .order("sort_order");
    if (tplErr || !template?.length) {
      throw new Error(`template fetch failed for ${opts.projectType}: ${tplErr?.message}`);
    }

    const items = template.map((stage, i) => {
      const completed = i < opts.completedStages;
      const inProgress = !completed && i < opts.completedStages + opts.inProgressStages;
      return {
        project_id: projectId,
        stage_name: stage.stage_name,
        description: stage.description,
        sort_order: stage.sort_order,
        client_visible: stage.default_client_visible,
        status: completed ? "completed" : inProgress ? "in_progress" : "pending",
        completed_date: completed ? isoDaysFromNow(-(opts.completedStages - i) * 7) : null,
        due_date: completed
          ? null
          : isoDaysFromNow((i - opts.completedStages + 1) * 14),
        client_update_text: completed
          ? `${stage.stage_name} has been completed.`
          : null,
        assigned_to: opts.managerId,
      };
    });
    const { error: itemsErr } = await db.from("project_timeline_items").insert(items);
    if (itemsErr) throw new Error(`timeline insert failed: ${itemsErr.message}`);

    const { error: actErr } = await db.from("activity_log").insert({
      project_id: projectId,
      actor_id: adminId,
      action: "project_created",
      details: { name: opts.name, project_type: opts.projectType },
    });
    if (actErr) throw new Error(`activity insert failed: ${actErr.message}`);

    console.log(`  + created: ${opts.name} (${template.length} timeline stages)`);
    return projectId;
  }

  const project1Id = await ensureProject({
    name: "Vaal Recycling Facility — Waste Management Licence",
    projectType: "waste_management_licence",
    status: "in_progress",
    priority: "high",
    managerId: staff1Id,
    startDaysAgo: 60,
    targetDaysAhead: 120,
    description:
      "WML application for the expanded sorting and baling facility. Authority pre-application meeting held in April. Watch the PPP timeline closely — holiday season may delay notices.",
    clientSummary:
      "Application for a Waste Management Licence covering the expanded recycling facility at Vanderbijlpark, including the public participation process and all supporting specialist studies.",
    completedStages: 4,
    inProgressStages: 1,
  });

  const project2Id = await ensureProject({
    name: "Annual Environmental Compliance Audit 2026",
    projectType: "audit",
    status: "in_progress",
    priority: "medium",
    managerId: staff2Id,
    startDaysAgo: 21,
    targetDaysAhead: 45,
    description:
      "Annual compliance audit against the existing WML conditions. Previous year's corrective actions must be verified on site.",
    clientSummary:
      "Annual environmental compliance audit of the Vanderbijlpark facility against the conditions of the current Waste Management Licence.",
    completedStages: 2,
    inProgressStages: 1,
  });

  // --- tasks ----------------------------------------------------------------------
  if (project1Id) {
    console.log("Tasks & updates:");
    const { error } = await db.from("tasks").insert([
      {
        project_id: project1Id,
        title: "Appoint specialist for geohydrological study",
        description: "Get three quotes and appoint. Needed before PPP can conclude.",
        assigned_to: staff1Id,
        priority: "high",
        status: "in_progress",
        due_date: isoDaysFromNow(7),
        created_by: adminId,
      },
      {
        project_id: project1Id,
        title: "Draft newspaper advertisement for PPP",
        description: "Afrikaans + English versions for the local paper.",
        assigned_to: staff2Id,
        priority: "medium",
        status: "todo",
        due_date: isoDaysFromNow(-3), // overdue, for dashboard testing
        created_by: staff1Id,
      },
      {
        project_id: project1Id,
        title: "Confirm I&AP register is up to date",
        assigned_to: staff1Id,
        priority: "low",
        status: "todo",
        due_date: isoDaysFromNow(12),
        created_by: staff1Id,
      },
    ]);
    if (error) throw new Error(`tasks insert failed: ${error.message}`);
    console.log("  + 3 tasks on the WML project");

    const { error: cErr } = await db.from("project_comments").insert([
      {
        project_id: project1Id,
        author_id: staff1Id,
        body: "The draft application is progressing well. We have started the specialist studies and expect the public participation process to begin within the next month.",
        visibility: "client",
      },
      {
        project_id: project1Id,
        author_id: staff1Id,
        body: "Internal: authority case officer changed — reintroduce ourselves at next check-in.",
        visibility: "internal",
      },
    ]);
    if (cErr) throw new Error(`comments insert failed: ${cErr.message}`);
    console.log("  + 1 client-visible update, 1 internal note");
  }

  if (project2Id) {
    const { error } = await db.from("tasks").insert([
      {
        project_id: project2Id,
        title: "Verify last year's corrective actions on site",
        assigned_to: staff2Id,
        priority: "high",
        status: "todo",
        due_date: isoDaysFromNow(5),
        created_by: staff2Id,
      },
      {
        project_id: project2Id,
        title: "Request updated waste manifests from client",
        assigned_to: staff2Id,
        priority: "medium",
        status: "waiting",
        due_date: isoDaysFromNow(10),
        created_by: staff2Id,
      },
    ]);
    if (error) throw new Error(`tasks insert failed: ${error.message}`);
    console.log("  + 2 tasks on the audit project");
  }

  console.log("\nSeed complete. Test logins (password for all: " + PASSWORD + ")");
  console.log("  admin:  admin@silverline.test");
  console.log("  staff:  staff1@silverline.test / staff2@silverline.test");
  console.log("  client: client1@vaalrecyclers.test / client2@vaalrecyclers.test");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
