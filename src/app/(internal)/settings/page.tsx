import type { Metadata } from "next";
import { requireInternal } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { USER_ROLE_LABELS } from "@/lib/labels";
import { AppearanceForm, ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireInternal();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Your account and preferences." />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
          <CardDescription className="text-xs">
            How your name appears across the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm fullName={profile.full_name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p>{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p>{USER_ROLE_LABELS[profile.role]}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Email and role changes are managed by an administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
