import { useActionState, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signIn,
  sendMagicLink,
  type SignInState,
  type MagicLinkState,
} from "./actions";

const initialState: SignInState = {};
const initialLinkState: MagicLinkState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [linkState, linkAction, linkPending] = useActionState(
    sendMagicLink,
    initialLinkState
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preserve where the user was headed (e.g. a review link they clicked while
  // signed out) so the emailed link returns them to it.
  const rawNext = searchParams.get("next") ?? "";
  const next = /^\/(?![/\\])/.test(rawNext) ? rawNext : "/";

  // SPA seam: the old server action redirect()ed; here the action returns the
  // destination and the form navigates.
  useEffect(() => {
    if (state.redirectTo) navigate(state.redirectTo, { replace: true });
  }, [state.redirectTo, navigate]);

  if (linkState.sentTo) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to{" "}
            <span className="font-medium text-foreground">
              {linkState.sentTo}
            </span>
            . Open it on this device and you will be signed in — no password
            needed.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          The link is valid for one hour and can only be used once.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setMode("password")}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  if (mode === "link") {
    return (
      <form action={linkAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="link-email">Email</Label>
          <Input
            id="link-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            autoFocus
            aria-invalid={!!linkState.fieldErrors?.email}
          />
          {linkState.fieldErrors?.email && (
            <p className="text-sm text-destructive">
              {linkState.fieldErrors.email[0]}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            We will email you a link that signs you in. There is no password to
            remember.
          </p>
        </div>
        {linkState.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {linkState.error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={linkPending}>
          {linkPending && <Loader2 className="animate-spin" />}
          Email me a sign-in link
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setMode("password")}
        >
          Use a password instead
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            aria-invalid={!!state.fieldErrors?.email}
          />
          {state.fieldErrors?.email && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!state.fieldErrors?.password}
          />
          {state.fieldErrors?.password && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>
        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setMode("link")}
      >
        <Mail />
        Email me a sign-in link
      </Button>
    </div>
  );
}
