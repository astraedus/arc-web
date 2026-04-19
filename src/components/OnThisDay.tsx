import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { JournalEntry } from "@/lib/types";

function snippet(text: string, max = 180) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

function monthDay(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

function formatRelative(iso: string) {
  const then = new Date(iso);
  const now = new Date();
  const days = Math.round(
    (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 365) return `${days} days ago`;
  const years = Math.floor(days / 365);
  const remainingDays = days - years * 365;
  if (remainingDays < 30) return `${years} year${years === 1 ? "" : "s"} ago`;
  const months = Math.floor(remainingDays / 30);
  return `${years}y ${months}mo ago`;
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Server component that surfaces entries from the same calendar day across
 * prior years/months. Renders nothing if user has no past entries on this date.
 */
export default async function OnThisDay() {
  const supabase = await createClient();

  const today = new Date();
  const todayMD = monthDay(today);
  const todayISO = today.toISOString().slice(0, 10);

  // Pull all entries except today's; we'll filter in JS.
  // Using a generous limit so we don't miss old anniversaries.
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, content, created_at, mood_tag, theme_tags")
    .lt("created_at", todayISO)
    .order("created_at", { ascending: false })
    .limit(1000);

  const list = (entries ?? []) as JournalEntry[];

  // Match by month-day only; collect 1 per (year-month) to avoid noise.
  const matches = list
    .filter((e) => monthDay(new Date(e.created_at)) === todayMD)
    .slice(0, 6);

  if (matches.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber/20 bg-amber/[0.04] p-6">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full bg-amber"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-dark">
          On this day
        </h2>
      </div>

      <div className="space-y-4">
        {matches.map((entry) => (
          <Link
            key={entry.id}
            href={`/app/notes/${entry.id}`}
            className="block rounded-lg border border-card-border bg-card p-4 transition-colors hover:border-amber/40"
          >
            <div className="flex items-baseline justify-between gap-3 text-xs text-warm-gray-light">
              <span className="font-medium text-warm-gray">
                {fullDate(entry.created_at)}
              </span>
              <span>{formatRelative(entry.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {snippet(entry.content || "(empty)")}
            </p>
            {(entry.mood_tag ||
              (entry.theme_tags && entry.theme_tags.length > 0)) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {entry.mood_tag && (
                  <span className="rounded-full bg-amber/10 px-2 py-0.5 text-xs text-amber-dark">
                    {entry.mood_tag}
                  </span>
                )}
                {entry.theme_tags?.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-warm-gray"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs italic text-warm-gray-light">
        The arc keeps its own dates.
      </p>
    </section>
  );
}
