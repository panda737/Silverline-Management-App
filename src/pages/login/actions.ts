import { z } from "zod";
import { supabase } from "@/lib/supabase";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type SignInState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
  /** SPA seam: the server action called redirect(); here the form navigates. */
  redirectTo?: string;
};

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Invalid email or password" };
  }

  // Route by role. The profile is created by a DB trigger on signup/invite.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user!.id)
    .maybeSingle();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return { error: "This account has been deactivated. Contact Silverline." };
  }

  return { redirectTo: profile.role === "client" ? "/portal" : "/dashboard" };
}

export async function signOut() {
  await supabase.auth.signOut();
  // Full reload on sign-out: clears all in-memory state and query caches.
  window.location.assign("/login");
}
