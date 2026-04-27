import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check your email — Arc Mirror",
  description: "We sent a link to set your password.",
  robots: { index: false, follow: false },
};

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  ltd_missing_session: {
    title: "We couldn't find your purchase.",
    body: "The link from Stripe was missing a session ID. Try the link from your purchase confirmation email, or contact hi@arc.diary.",
  },
  ltd_activation_failed: {
    title: "We couldn't activate that purchase.",
    body: "Either the session has already been claimed, or it doesn't match a lifetime SKU. If you just paid and this seems wrong, email hi@arc.diary with your Stripe receipt.",
  },
  ltd_email_send_failed: {
    title: "Your purchase is in, but we couldn't email the link.",
    body: "Email hi@arc.diary with your Stripe receipt and we'll resend manually.",
  },
};

function readStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const errorKey = readStringParam(params.error);
  const errorCopy = errorKey ? ERROR_COPY[errorKey] : null;

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center">
            <img src="/arc-logo-nav.svg" alt="Arc" width={90} height={26} />
          </a>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg space-y-8 text-center">
          {errorCopy ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                ✕
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {errorCopy.title}
                </h1>
                <p className="text-base text-warm-gray">{errorCopy.body}</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber/15 text-3xl">
                ✉
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Check your email.
                </h1>
                <p className="text-base text-warm-gray">
                  Your lifetime access is in. We just sent a link to the email
                  you used at checkout. Click it to set a password and open
                  your Mirror.
                </p>
                <p className="text-sm text-warm-gray-light">
                  The link expires in 60 minutes. Check spam if you don&apos;t
                  see it.
                </p>
              </div>

              <div className="rounded-2xl border border-card-border bg-card p-6 text-left">
                <p className="text-sm font-semibold text-foreground">
                  Already have an Arc account?
                </p>
                <p className="mt-2 text-sm text-warm-gray">
                  If you bought lifetime with the same email as your existing
                  account, your Mirror is already unlocked. Just{" "}
                  <a
                    href="/"
                    className="font-medium text-amber-dark hover:underline"
                  >
                    sign in
                  </a>
                  .
                </p>
              </div>
            </>
          )}

          <p className="text-xs text-warm-gray-light">
            Stuck? Email{" "}
            <a
              href="mailto:hi@arc.diary"
              className="text-amber-dark hover:underline"
            >
              hi@arc.diary
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
