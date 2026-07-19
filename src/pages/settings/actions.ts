import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { getActionProfile } from "@/lib/action-profile";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name"),
});

export type ProfileFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"full_name", string[]>>;
};

export async function updateOwnProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const profile = await getActionProfile();
  if (!profile || !profile.active) {
    return { error: "Not signed in." };
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ProfileFormState["fieldErrors"],
    };
  }

  // RLS: users may update their own row; a DB trigger blocks role/company changes.
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", profile.id);
  if (error) {
    return { error: `Could not update profile: ${error.message}` };
  }

  await queryClient.invalidateQueries({ queryKey: ["profile"] });
  await queryClient.invalidateQueries({ queryKey: ["staff"] });
  return { success: "Profile updated." };
}
