import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  COMPETITORS,
  getCompetitor,
  type ComparisonRow,
} from "../_data/content";

// Fully static. Only the three slugs below are valid routes.
// Anything else 404s instead of being generated on-demand.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

type PageProps = {
  params: Promise<{ competitor: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { competitor } = await params;
  const content = getCompetitor(competitor);
  if (!content) return {};

  const url = `https://arc-journal.app/alternative/${content.slug}`;
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url,
      type: "article",
      siteName: "Arc Journal",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
    },
  };
}

export default async function AlternativePage({ params }: PageProps) {
  const { competitor } = await params;
  const content = getCompetitor(competitor);
  if (!content) notFound();

  const others = COMPETITORS.filter((c) => c.slug !== content.slug);

  return (
    <main className="flex min-h-screen flex-col">
      {/* ─── Nav ───────────────────────────────────────────────────────── */}
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Arc home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arc-logo-nav.svg" alt="Arc" width={90} height={26} />
          </Link>
          <Link
            href="/alternative"
            className="text-sm text-warm-gray hover:text-foreground transition-colors"
          >
            All comparisons
          </Link>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-6 pt-20 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            Alternative to {content.name}
          </div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl">
            Arc — the honest alternative to{" "}
            <span className="italic">{content.name}</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-warm-gray">
            {content.tagline}
          </p>
        </div>
      </section>

      {/* ─── Why switch ────────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-sm font-mono uppercase tracking-widest text-amber-dark">
            Why people switch
          </h2>
          <div className="mt-6 space-y-5 text-base text-warm-gray">
            {content.whySwitch.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison table ──────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-sm font-mono uppercase tracking-widest text-amber-dark">
            Side by side
          </h2>
          <h3 className="mt-3 text-2xl font-bold tracking-tight">
            Arc vs {content.name}, feature by feature.
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-warm-gray">
            Where {content.name} wins a row, we&apos;ve said so. An honest
            comparison is worth more than a flattering one.
          </p>

          <div className="mt-8 overflow-hidden rounded-lg border border-card-border bg-card">
            {/* Header row */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-4 border-b border-card-border bg-muted px-5 py-3 text-xs font-mono uppercase tracking-wider text-warm-gray">
              <span>Feature</span>
              <span>Arc</span>
              <span>{content.name}</span>
              <span className="text-right">Winner</span>
            </div>
            {content.comparison.map((row, i) => (
              <ComparisonRowCard
                key={row.feature}
                row={row}
                competitorName={content.name}
                isLast={i === content.comparison.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── What you'll miss ──────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-lg border border-card-border bg-card p-8">
          <h2 className="text-sm font-mono uppercase tracking-widest text-amber-dark">
            What you&apos;ll miss
          </h2>
          <p className="mt-5 text-base text-warm-gray">
            {content.whatYoullMiss}
          </p>
        </div>
      </section>

      {/* ─── Switching guide ───────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-sm font-mono uppercase tracking-widest text-amber-dark">
            How to switch from {content.name}
          </h2>
          <ol className="mt-6 space-y-5">
            {content.switchingGuide.map((s, i) => (
              <li key={s.step} className="flex gap-5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber/40 bg-amber/10 text-xs font-mono text-amber-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-medium text-foreground">{s.step}</div>
                  <div className="mt-1 text-sm text-warm-gray">{s.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-lg border border-card-border bg-card p-10 text-center">
          <h2 className="font-serif text-2xl italic text-foreground">
            A journal that reflects you back.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-warm-gray">
            Arc is free to start. No card. The switch is one export and one
            import — give it a week.
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
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-card-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              See the demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Other comparisons ─────────────────────────────────────────── */}
      {others.length > 0 && (
        <section className="px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-sm font-mono uppercase tracking-widest text-amber-dark">
              Other comparisons
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/alternative/${o.slug}`}
                    className="block rounded-lg border border-card-border bg-card p-5 transition-colors hover:border-amber/50"
                  >
                    <div className="text-xs font-mono uppercase tracking-wider text-warm-gray">
                      Arc vs {o.name}
                    </div>
                    <div className="mt-1 text-sm text-foreground">
                      {o.tagline}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-card-border py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-warm-gray">
            &copy; {new Date().getFullYear()} Arc Journal. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-warm-gray">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link
              href="/alternative"
              className="hover:text-foreground transition-colors"
            >
              All comparisons
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

// ─── Row component ─────────────────────────────────────────────────────────
function ComparisonRowCard({
  row,
  competitorName,
  isLast,
}: {
  row: ComparisonRow;
  competitorName: string;
  isLast: boolean;
}) {
  const winnerLabel =
    row.winner === "arc"
      ? "Arc"
      : row.winner === "competitor"
        ? competitorName
        : "Tie";
  const winnerColor =
    row.winner === "arc"
      ? "text-amber-dark"
      : row.winner === "competitor"
        ? "text-foreground"
        : "text-warm-gray";

  return (
    <div
      className={`grid grid-cols-1 gap-3 px-5 py-5 text-sm sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-start ${
        isLast ? "" : "border-b border-card-border"
      }`}
    >
      <div className="font-medium text-foreground">{row.feature}</div>
      <div className="text-warm-gray">
        <span className="sm:hidden text-xs font-mono uppercase tracking-wider text-warm-gray-light">
          Arc:{" "}
        </span>
        {row.arc}
      </div>
      <div className="text-warm-gray">
        <span className="sm:hidden text-xs font-mono uppercase tracking-wider text-warm-gray-light">
          {competitorName}:{" "}
        </span>
        {row.competitor}
      </div>
      <div
        className={`text-xs font-mono uppercase tracking-wider sm:text-right ${winnerColor}`}
      >
        {winnerLabel}
      </div>
    </div>
  );
}
