import { Leaf } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  // Matches the old metadata: title was the full string, not templated.
  useDocumentTitle("Sign in");

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Silverline</h1>
          <p className="text-sm text-muted-foreground">
            Environmental compliance project portal
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Staff and client accounts use the same sign-in. Accounts are
              created by invitation only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
