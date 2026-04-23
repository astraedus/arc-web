import type { Metadata } from "next";
import Link from "next/link";

import { COMPETITORS } from "./_data/content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Arc — compared to Day One, Notion, Journey",
  description:
    "Honest, side-by-side comparisons of Arc against the best known journaling apps. Where competitors win, we say so.",
  alternates: { canonical: "https://arc-journal.app/alternative" },
  openGraph: {
    title: "Arc — honest journaling comparisons",
    description:
      "Compare Arc to Day One, Notion, and Journey. Side by side, without the spin.",
    url: "https://arc-journal.app/alternative",
    type: "website",
    siteName: "Arc Journal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arc — honest journaling comparisons",
    description:
      "Compare Arc to Day One, Notion, and Journey. Side by side, without the spin.",
  },
};

export default function AlternativesIndexPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Arc home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arc-logo-nav.svg" alt="Arc" width={90} height={26} />
          </Link>
          <Link
            href="/signup"
            className="text-sm text-warm-gray hover:text-foreground transition-colors"
          >
            Try Arc
          </Link>
        </div>
      </nav>

      <section className="px-6 pt-20 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            Comparisons
          </div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl">
            Arc compared to the apps you already know.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-warm-gray">
            The best journaling app is the one you actually open tomorrow. Here
            is where Arc fits — and where the others still win.
          </p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <ul className="grid gap-4">
            {COMPETITORS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/alternative/${c.slug}`}
                  className="group block rounded-lg border border-card-border bg-card p-6 transition-colors hover:border-amber/50"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-xl font-bold tracking-tight">
                      Arc vs {c.name}
                    </h2>
                    <span className="text-xs font-mono uppercase tracking-wider text-warm-gray group-hover:text-amber-dark">
                      Read →
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-warm-gray">{c.tagline}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-lg border border-card-border bg-card p-10 text-center">
          <h2 className="font-serif text-2xl italic text-foreground">
            A globe of people being honest about who they&apos;re becoming.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-warm-gray">
            Arc is free to start. Your vault lives on your phone and in any
            browser. Export the lot whenever you want.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-amber-dark"
            >
              Try Arc
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-card-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Home
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-card-border py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-warm-gray">
            &copy; {new Date().getFullYear()} Arc Journal. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-warm-gray">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <a
              href="https://arc-landing-pi.vercel.app"
              className="hover:text-foreground transition-colors"
            >
              About Arc
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
