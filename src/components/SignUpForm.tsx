"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const supabase = createClient();
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
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-warm-gray">
        Already have an account?{" "}
        <a href="/" className="font-medium text-amber-dark hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
