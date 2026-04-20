import Link from "next/link";

export const EARLY_ATLAS_THRESHOLD = 10;

type EarlyAtlasStateProps = {
  entryCount: number;
  title: string;
  body: string;
  quote?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function EarlyAtlasState({
  entryCount,
  title,
  body,
  quote = "Your atlas draws itself after a few entries. Keep writing.",
  ctaHref = "/app/new",
  ctaLabel = entryCount === 0 ? "Write your first entry" : "Write the next entry",
}: EarlyAtlasStateProps) {
  const entriesLeft = Math.max(0, EARLY_ATLAS_THRESHOLD - entryCount);

  return (
    <div className="rounded-[2rem] border border-dashed border-card-border bg-card px-6 py-10 text-center sm:px-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber/10">
        <svg
          aria-hidden="true"
          viewBox="0 0 96 96"
          className="h-12 w-12 text-amber-dark"
          fill="none"
        >
          <path
            d="M18 66L40 42L58 52L76 30"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
          <circle cx="18" cy="66" r="5" fill="currentColor" />
          <circle cx="40" cy="42" r="4" fill="currentColor" opacity="0.9" />
          <circle cx="58" cy="52" r="4" fill="currentColor" opacity="0.8" />
          <circle cx="76" cy="30" r="6" fill="currentColor" />
        </svg>
      </div>

      <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-warm-gray-light">
        {title}
      </p>
      <p
        className="mt-4 text-xl italic text-foreground sm:text-2xl"
        style={{
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
        }}
      >
        {quote}
      </p>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-warm-gray">
        {body}
      </p>
      <p className="mt-4 text-xs text-warm-gray-light">
        {entryCount} / {EARLY_ATLAS_THRESHOLD} entries so far
        {entriesLeft > 0
          ? `, ${entriesLeft} more before it has enough to work with.`
          : "."}
      </p>
      <Link
        href={ctaHref}
        className="mt-8 inline-flex items-center rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
