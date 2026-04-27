import SignUpForm from "@/components/SignUpForm";

function readStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const prefillEmail = readStringParam(params.prefill);
  const isLtd = readStringParam(params.ltd) === "true";
  const sessionId = readStringParam(params.session_id);
  const signInHref = isLtd
    ? `/?ltd=true&prefill=${encodeURIComponent(prefillEmail)}&redirectTo=${encodeURIComponent(
        "/app?ltd=true"
      )}`
    : "/";

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center">
            <img src="/arc-logo-nav.svg" alt="Arc" width={90} height={26} />
          </a>
          <a
            href={signInHref}
            className="text-sm text-warm-gray hover:text-foreground transition-colors"
          >
            Already have an account?
          </a>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLtd ? "Set your password" : "Create your Arc account"}
            </h1>
            <p className="mt-3 text-sm text-warm-gray">
              {isLtd
                ? "Your lifetime purchase is in. Set a password and open your Mirror."
                : "One account. Phone, desktop, and everywhere Arc goes next."}
            </p>
          </div>
          <SignUpForm
            isLifetimePurchase={isLtd}
            ltdSessionId={sessionId}
            prefillEmail={prefillEmail}
          />
        </div>
      </div>
    </main>
  );
}
