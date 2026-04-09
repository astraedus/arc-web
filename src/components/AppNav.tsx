import Link from "next/link";

interface AppNavProps {
  email: string | null;
}

export default function AppNav({ email }: AppNavProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/app" className="text-xl font-semibold tracking-tight">
          Arc<span className="text-amber">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/app"
            className="text-warm-gray hover:text-foreground transition-colors"
          >
            Stream
          </Link>
          <Link
            href="/app/new"
            className="text-warm-gray hover:text-foreground transition-colors"
          >
            New note
          </Link>
          <Link
            href="/app/profile"
            className="text-warm-gray hover:text-foreground transition-colors"
          >
            Profile
          </Link>
          {email ? (
            <span className="hidden text-xs text-warm-gray-light sm:inline">
              {email}
            </span>
          ) : null}
          <form action="/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
