import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase auth verification links.
 * Supports both styles:
 *  - token_hash + type (when email templates use {{ .TokenHash }})
 *  - code (PKCE-style redirect)
 * On success, invited/recovering users are sent to set a password.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();

  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    const dest =
      next ?? (type === "invite" || type === "recovery" ? "/auth/set-password" : "/");
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_link", request.url)
  );
}
