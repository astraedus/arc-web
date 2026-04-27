"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

type SignUpFormProps = {
  isLifetimePurchase?: boolean;
  ltdSessionId?: string;
  prefillEmail?: string;
};

export default function SignUpForm({
  isLifetimePurchase = false,
  ltdSessionId = "",
  prefillEmail = "",
}: SignUpFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (isLifetimePurchase) {
      if (!ltdSessionId) {
        setError("Missing checkout session. Return to your purchase confirmation link.");
        return;
      }

      const claimResponse = await fetch("/auth/ltd-claim", {
        body: JSON.stringify({
          email,
          password,
          sessionId: ltdSessionId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const claimResult = (await claimResponse.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!claimResponse.ok) {
        setError(claimResult.error ?? "Failed to unlock your lifetime access.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      posthog.capture("ltd_account_claimed");
      startTransition(() => {
        router.replace("/app?ltd=true");
        router.refresh();
      });
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    // If email confirmation is disabled, a session is returned immediately.
    if (data.session) {
      posthog.capture("user_signed_up");
      startTransition(() => {
        router.replace("/app");
        router.refresh();
      });
      return;
    }
    // Otherwise, user must confirm via email first.
    posthog.capture("user_signed_up");
    setInfo("Check your email for a confirmation link to finish signing up.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-card-border bg-card p-8 shadow-sm"
    >
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-warm-gray-light"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-warm-gray-light"
          placeholder="At least 6 characters"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-amber-dark" role="status">
          {info}
        </p>
      ) : null}
      {isLifetimePurchase ? (
        <p className="text-sm text-warm-gray">
          We&apos;ll attach this password to the email you used at checkout.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark disabled:opacity-60"
      >
        {isPending
          ? isLifetimePurchase
            ? "Unlocking access..."
            : "Creating account..."
          : isLifetimePurchase
            ? "Set password and continue"
            : "Create account"}
      </button>
      <p className="text-center text-sm text-warm-gray">
        Already have an account?{" "}
        <a
          href={
            isLifetimePurchase
              ? `/?ltd=true&prefill=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(
                  "/app?ltd=true"
                )}`
              : "/"
          }
          className="font-medium text-amber-dark hover:underline"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
