import type { Metadata } from "next";
import Link from "next/link";
import DemoMirrorClient from "./DemoMirrorClient";
import DemoMirrorInsights from "./DemoMirrorInsights";
import { DEMO_REFLECTIONS, DEMO_INSIGHTS } from "./sample-data";

export const metadata: Metadata = {
  title: "Demo — The Mirror | Arc Journal",
  description:
    "See The Mirror in action. A preview of Arc over a fictional user's journal — no signup required.",
};

// Static page: no per-request data fetching. Safe to prerender.
export const dynamic = "force-static";

export default function DemoMirrorPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ───── Top nav (logo + signup CTA) ───────────────────────────── */}
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arc-logo-nav.svg"
              alt="Arc"
              width={90}
              height={26}
            />
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
          >
            Start your own Mirror
          </Link>
        </div>
      </nav>

      {/* ───── Demo banner (subtle, honest) ──────────────────────────── */}
      <div className="border-b border-amber/20 bg-amber/5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3 text-sm">
          <p className="text-warm-gray">
            <span className="font-semibold text-amber-dark">Demo —</span>{" "}
            This is a Mirror built from a fictional user&apos;s journal. Ready
            to start your own?
          </p>
          <Link
            href="/signup"
            className="shrink-0 text-sm font-semibold text-amber-dark underline underline-offset-2 hover:text-amber"
          >
            Sign up →
          </Link>
        </div>
      </div>

      {/* ───── Mirror surface ────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <header className="pt-4 pb-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
            The Mirror
          </p>
          <p
            className="mt-4 text-2xl italic text-foreground"
            style={{
              fontFamily:
                "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
            }}
          >
            Alex&apos;s journal, reflected back to them.
          </p>
          <p className="mt-6 text-sm text-warm-gray-light">
            15 entries over ~2 months. Topics: work, mum, sleep, running, the
            piano, a friendship returning.
          </p>
        </header>

        <section className="mb-24">
          <DemoMirrorClient initialReflections={DEMO_REFLECTIONS} />
        </section>

        <section className="border-t border-card-border pt-16">
          <DemoMirrorInsights insights={DEMO_INSIGHTS} />
        </section>

        <div className="mt-24 mb-8 text-center">
          <span className="text-warm-gray-light/40 text-xs tracking-[0.3em]">
            • • •
          </span>
        </div>
      </div>

      {/* ───── Why Arc section ────────────────────────────────────────── */}
      <section className="border-t border-card-border bg-card/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
            Why Arc
          </p>
          <h2
            className="mt-3 max-w-2xl text-3xl italic leading-tight text-foreground"
            style={{
              fontFamily:
                "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
            }}
          >
            An honest diary, and an AI that reads your whole story without
            telling you what to do with it.
          </h2>

          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-dark">
                Write plainly
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Type, speak, or capture on the go. Arc organizes your voice
                without rewriting you — the raw transcript is always there.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-dark">
                The Mirror reads it back
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                Threads that keep returning. Patterns you didn&apos;t see.
                Questions you asked yourself months apart. The Mirror notices,
                and names what it sees.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-dark">
                Yours, always
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-warm-gray">
                One-click export. No training on your journal. The Mirror is a
                quiet observer — not an editor, not a coach, not a product
                pretending to be a friend.
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
            >
              Start your own Mirror
            </Link>
            <p className="text-xs italic text-warm-gray-light">
              Free to start. Your words stay yours.
            </p>
          </div>
        </div>
      </section>

      {/* ───── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-card-border py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-xs text-warm-gray">
            &copy; {new Date().getFullYear()} Arc Journal. A demo page — the
            entries on this page are fictional.
          </p>
          <div className="flex items-center gap-6 text-xs text-warm-gray">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hover:text-foreground transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
