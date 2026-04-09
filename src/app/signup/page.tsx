import SignUpForm from "@/components/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="text-xl font-semibold tracking-tight">
            Arc<span className="text-amber">.</span>
          </a>
          <a
            href="/"
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
              Create your Arc account
            </h1>
            <p className="mt-3 text-sm text-warm-gray">
              One account. Phone, desktop, and everywhere Arc goes next.
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </main>
  );
}
