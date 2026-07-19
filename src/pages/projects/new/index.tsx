import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectForm } from "./project-form";

function NewProjectLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export default function NewProjectPage() {
  useDocumentTitle("New project");
  const { data: profile } = useProfile();

  const clientsQuery = useQuery({
    queryKey: ["clients", "list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, company_name")
        .order("company_name");
      return data;
    },
  });

  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["admin", "staff"])
        .eq("active", true)
        .order("full_name");
      return data;
    },
  });

  if (clientsQuery.isPending || staffQuery.isPending || !profile) {
    return <NewProjectLoading />;
  }

  const clients = clientsQuery.data;
  const staff = staffQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/projects">
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
