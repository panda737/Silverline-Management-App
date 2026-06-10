import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireInternal } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "./project-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  const profile = await requireInternal();
  const supabase = await createClient();

  const [{ data: clients }, { data: staff }] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["admin", "staff"])
      .eq("active", true)
      .order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/projects">
            <ArrowLeft className="size-4" />
            Projects
          </Link>
        </Button>
        <h1 className="text-xl font-medium tracking-tight">New project</h1>
        <p className="text-sm text-muted-foreground">
          The project timeline is generated automatically from the template for
          the selected project type and can be edited afterwards.
        </p>
      </div>
      <ProjectForm
        clients={(clients ?? []).map((c) => ({
          id: c.id,
          label: c.company_name,
        }))}
        staff={(staff ?? []).map((s) => ({ id: s.id, label: s.full_name }))}
        defaultManagerId={profile.id}
      />
    </div>
  );
}
