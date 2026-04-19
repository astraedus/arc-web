import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link
        href="/"
        className="text-2xl font-semibold tracking-tight text-foreground"
      >
        Arc.
      </Link>
      <h1 className="mt-8 text-5xl font-bold tracking-tight text-foreground">
        404
      </h1>
      <p className="mt-3 text-lg text-warm-gray">
        This page could not be found.
      </p>
      <Link
        href="/app"
        className="mt-8 inline-block rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
      >
        Go to Stream
      </Link>
    </div>
  );
}
