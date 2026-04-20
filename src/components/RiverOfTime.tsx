"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  mood_tag: string | null;
};
type Reflection = {
  id: string;
  title: string;
  reflection_type: string;
  created_at: string;
};

const MOOD_COLOR: Record<string, string> = {
  alive: "#D97706",      // amber-600 (darker, vibrant)
  hopeful: "#E8A849",    // amber accent
  steady: "#A88B5C",     // muted bronze (visible on cream)
  uncertain: "#7C8E6B",  // moss
  struggling: "#5A748F", // dusty blue
};

function moodColor(m: string | null) {
  if (!m) return "#A88B5C";
  return MOOD_COLOR[m.toLowerCase()] ?? "#A88B5C";
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shortMonth(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function describeGap(days: number) {
  if (days < 14) return null;
  if (days < 30) return `${days} quiet days`;
  if (days < 60) return `a quiet month`;
  if (days < 120) return `${Math.round(days / 30)} quiet months`;
  if (days < 365) return `a long quiet stretch`;
  return `${Math.round(days / 365)} quiet ${Math.round(days / 365) === 1 ? "year" : "years"}`;
}

export default function RiverOfTime({
  entries,
  reflections,
}: {
  entries: Entry[];
  reflections: Reflection[];
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  // Build time-sorted, oldest first for left-to-right reading.
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [entries]
  );

  // Bucket by day
  const buckets = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of sorted) {
      const k = dayKey(e.created_at);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries()).map(([k, items]) => ({ day: k, items }));
  }, [sorted]);

  // Identify gaps and build a unified timeline of bands + gaps for rendering
  const bands = useMemo(() => {
    type Band = { kind: "day"; day: string; items: Entry[] } | { kind: "gap"; days: number; from: string; to: string };
    const out: Band[] = [];
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      out.push({ kind: "day", day: b.day, items: b.items });
      const next = buckets[i + 1];
      if (next) {
        const dt =
          (new Date(next.day).getTime() - new Date(b.day).getTime()) /
          (1000 * 60 * 60 * 24);
        if (dt > 7) {
          out.push({
            kind: "gap",
            days: Math.round(dt),
            from: b.day,
            to: next.day,
          });
        }
      }
    }
    return out;
  }, [buckets]);

  // Reflection markers indexed by month
  const reflectionsByMonth = useMemo(() => {
    const m = new Map<string, Reflection[]>();
    for (const r of reflections) {
      const k = monthKey(r.created_at);
      const arr = m.get(k) ?? [];
      arr.push(r);
      m.set(k, arr);
    }
    return m;
  }, [reflections]);

  // Month boundaries — for axis labels
  const monthBoundaries = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const b of bands) {
      if (b.kind === "day") {
        const m = monthKey(b.day);
        if (!seen.has(m)) {
          seen.add(m);
          list.push(m);
        }
      }
    }
    return list;
  }, [bands]);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-card-border bg-card p-12 text-center">
        <p className="text-sm text-warm-gray">
          The river hasn&apos;t started flowing yet. Write your first entry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Months ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-[10px] uppercase tracking-wider text-warm-gray-light">
        {monthBoundaries.map((m) => (
          <span
            key={m}
            className="shrink-0 rounded bg-muted px-2 py-1 font-medium"
          >
            {shortMonth(m)}
          </span>
        ))}
      </div>

      {/* The river */}
      <div className="relative rounded-2xl border border-card-border bg-card p-4">
        <div className="flex flex-row items-center gap-px overflow-x-auto py-4">
          {bands.map((b, i) => {
            if (b.kind === "gap") {
              const label = describeGap(b.days);
              const width = Math.min(80, 20 + Math.log2(b.days) * 8);
              return (
                <div
                  key={`gap-${i}`}
                  className="group relative flex shrink-0 flex-col items-center justify-end px-2"
                  style={{ minHeight: 96 }}
                  title={`${b.days} days between ${b.from} and ${b.to}`}
                >
                  <div
                    className="border-b-2 border-dotted border-warm-gray-light/40"
                    style={{ width: `${width}px` }}
                  />
                  {label && (
                    <span className="mt-1.5 whitespace-nowrap text-[10px] italic text-warm-gray-light">
                      {label}
                    </span>
                  )}
                </div>
              );
            }
            // Day column - stones stacked vertically, mood-colored, click navigates.
            const dayHover = hover === b.day;
            const refs = reflectionsByMonth.get(monthKey(b.day)) ?? [];
            const hasReflection = refs.some(
              (r) => dayKey(r.created_at) === b.day
            );
            return (
              <div
                key={b.day}
                className="group relative flex shrink-0 flex-col items-center justify-end px-0.5"
                style={{ minHeight: 96 }}
                onMouseEnter={() => setHover(b.day)}
                onMouseLeave={() => setHover(null)}
              >
                <div className="flex flex-col items-center gap-1 py-1">
                  {b.items.map((e) => {
                    const len = e.content?.length ?? 0;
                    const h = Math.max(
                      8,
                      Math.min(28, 8 + Math.sqrt(len) * 0.9)
                    );
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => router.push(`/app/notes/${e.id}`)}
                        className="block w-3 rounded-sm transition-all hover:scale-125 hover:shadow-md"
                        style={{
                          height: `${h}px`,
                          background: moodColor(e.mood_tag),
                          boxShadow: "inset 0 0 0 0.5px rgba(43, 40, 34, 0.18)",
                        }}
                        aria-label={`${fullDate(e.created_at)} (${len} chars)`}
                        title={`${fullDate(e.created_at)} - ${e.mood_tag ?? "no mood"}`}
                      />
                    );
                  })}
                </div>
                {hasReflection && (
                  <span
                    className="-mt-0.5 h-2 w-2 rounded-full bg-amber-dark ring-2 ring-amber/30"
                    aria-label="Reflection"
                    title="Reflection on this day"
                  />
                )}
                {dayHover && (
                  <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-card-border bg-card px-2.5 py-1.5 text-xs shadow-md">
                    <div className="font-medium text-foreground">
                      {fullDate(b.day)}
                    </div>
                    <div className="text-warm-gray-light">
                      {b.items.length} {b.items.length === 1 ? "entry" : "entries"}
                      {hasReflection ? " + reflection" : ""}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-warm-gray-light">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded"
            style={{ background: MOOD_COLOR.alive }}
          />
          alive
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded"
            style={{ background: MOOD_COLOR.hopeful }}
          />
          hopeful
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded"
            style={{ background: MOOD_COLOR.steady }}
          />
          steady
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded"
            style={{ background: MOOD_COLOR.uncertain }}
          />
          uncertain
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-3 rounded"
            style={{ background: MOOD_COLOR.struggling }}
          />
          struggling
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-dark" />
          reflection
        </span>
      </div>
    </div>
  );
}
