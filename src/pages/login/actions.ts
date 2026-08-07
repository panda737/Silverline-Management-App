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

const magicLinkSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type MagicLinkState = {
  error?: string;
  fieldErrors?: { email?: string[] };
  /** Set once the mail is away — the form swaps to a "check your inbox" panel. */
  sentTo?: string;
};

/**
 * Passwordless sign-in. There is no password to forget, which is the point:
 * the reviewer who uses this lives in Outlook and should never be blocked by a
 * reset flow.
 *
 * The link lands on /auth/confirm, which already handles token_hash + type and
 * honours a same-origin ?next=. `shouldCreateUser: false` matters — without it
 * a typo in the address would silently mint a brand-new account.
 */
export async function sendMagicLink(
  _prevState: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const rawNext = String(formData.get("next") ?? "");
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : "/";
  const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
  });

  if (error) {
    // Deliberately vague: confirming which addresses exist would leak the staff
    // list to anyone with the login page open.
    return {
      error:
        "Could not send the link. Check the address, or ask Silverline to set up your access.",
    };
  }

  return { sentTo: parsed.data.email };
}
