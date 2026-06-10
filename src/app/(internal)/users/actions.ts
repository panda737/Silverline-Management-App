"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter the person's name"),
    email: z.string().trim().email("Enter a valid email address"),
    role: z.enum(["admin", "staff", "client"]),
    client_id: z
      .string()
      .uuid()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
  })
  .refine((data) => data.role !== "client" || data.client_id, {
    message: "Client users must be linked to a client company",
    path: ["client_id"],
  });

export type InviteState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"full_name" | "email" | "role" | "client_id", string[]>>;
};

export async function inviteUser(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  // Only active admins may invite users — re-checked server-side.
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || !profile.active) {
    return { error: "Only admins can invite users." };
  }

  const parsed = inviteSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    client_id: formData.get("client_id") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as InviteState["fieldErrors"],
    };
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: {
      full_name: input.full_name,
      user_role: input.role,
      client_id: input.client_id,
    },
    redirectTo: `${siteUrl}/auth/set-password`,
  });

  if (error) {
    return { error: `Invite failed: ${error.message}` };
  }

  // Also stamp role into app_metadata (not editable by the user).
  if (data.user) {
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { user_role: input.role, client_id: input.client_id },
    });
  }

  revalidatePath("/users");
  return { success: `Invitation sent to ${input.email}` };
}

const setActiveSchema = z.object({
  user_id: z.string().uuid(),
  active: z.enum(["true", "false"]),
});

export async function setUserActive(formData: FormData): Promise<void> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || !profile.active) {
    throw new Error("Only admins can manage users.");
  }

  const parsed = setActiveSchema.safeParse({
    user_id: formData.get("user_id"),
    active: formData.get("active"),
  });
  if (!parsed.success) throw new Error("Invalid request");
  if (parsed.data.user_id === profile.id) {
    throw new Error("You cannot deactivate your own account.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.user_id);
  if (error) throw new Error(error.message);

  revalidatePath("/users");
}
