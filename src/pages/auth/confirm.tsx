import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Port of src/app/auth/confirm/route.ts (the only old API route).
 * Handles Supabase auth verification links, both styles:
 *  - token_hash + type (email templates using {{ .TokenHash }})
 *  - code (PKCE-style redirect)
 * On success, invited/recovering users are sent to set a password.
 */
export default function AuthConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // OTP tokens are single-use; StrictMode double-invokes effects in dev, so the
  // exchange must only ever run once.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const code = searchParams.get("code");
    // Only allow same-origin relative paths — "//evil.com" and absolute URLs
    // would otherwise turn this into an open redirect on invite/recovery links.
    const rawNext = searchParams.get("next");
    const next = rawNext && /^\/(?![/\\])/.test(rawNext) ? rawNext : null;

    const run = async () => {
      let ok = false;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        ok = !error;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        ok = !error;
      }

      if (ok) {
        const dest =
          next ??
          (type === "invite" || type === "recovery"
            ? "/auth/set-password"
            : "/");
        navigate(dest, { replace: true });
      } else {
        navigate("/login?error=invalid_link", { replace: true });
      }
    };
    void run();
  }, [searchParams, navigate]);

  return <div className="min-h-svh" aria-busy="true" />;
}
