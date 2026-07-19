import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";

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

/**
 * Inviting a user requires the service-role key (GoTrue admin API), which must
 * never ship in a browser bundle — so this is the one action that calls a
 * Supabase Edge Function (supabase/functions/invite-user). The function
 * re-verifies the caller is an active admin before doing anything.
 */
export async function inviteUser(
  _prev: InviteState,
  formData: FormData
): Promise<InviteState> {
  // Same client-side pre-check + validation as the old server action.
  const profile = await getActionProfile();
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

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: parsed.data,
  });
  if (error) {
    return { error: `Invite failed: ${error.message}` };
  }
  if (data?.error) {
    return { error: data.error };
  }

  await queryClient.invalidateQueries({ queryKey: ["users"] });
  return { success: data?.success ?? `Invitation sent to ${parsed.data.email}` };
}

const setActiveSchema = z.object({
  user_id: z.string().uuid(),
  active: z.enum(["true", "false"]),
});

export async function setUserActive(formData: FormData): Promise<void> {
  // Only active admins may manage users — RLS (profiles_update_own + the
  // protect_profile_fields trigger) enforces the same rule server-side.
  const profile = await getActionProfile();
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

  const { error } = await supabase
    .from("profiles")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.user_id);
  if (error) throw new Error(error.message);

  await queryClient.invalidateQueries({ queryKey: ["users"] });
  await queryClient.invalidateQueries({ queryKey: ["staff"] });
}
