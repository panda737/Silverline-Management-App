import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClientProjectView,
  ClientProjectViewLoading,
  useClientProjectView,
} from "./client-project-view";

/**
 * Client-facing project detail. All of the rendering lives in
 * <ClientProjectView>, which the staff "Client View" tab renders too — so the
 * preview staff check against is the same component, not an imitation of it.
 */
export default function PortalProjectPage() {
  const { id } = useParams();
  const { data, isPending, error } = useClientProjectView(id);

  useDocumentTitle(data?.project?.name ?? "Project");

  const backLink = (
    <Link
      to="/portal"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to your projects
    </Link>
  );

  if (error) throw error;

  if (isPending || !data) {
    return (
      <div className="space-y-6">
        {backLink}
        <ClientProjectViewLoading />
      </div>
    );
  }

  if (!data.project) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This project isn’t available on your portal.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {backLink}
      <ClientProjectView data={data} />
    </div>
  );
}
