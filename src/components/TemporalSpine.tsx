"use client";

/**
 * TemporalSpine — Unified chronological visualization of the Mirror.
 *
 * Merges the two previously-separate "Past reflections" list and "What the
 * Mirror has noticed" insights grid into a single vertical timeline. One
 * thin amber spine runs down the page; reflections sit as mood-colored
 * circles on the spine with cards branching left/right (alternating on
 * desktop, stacked on mobile), while insights appear as smaller colored
 * dots between reflections with a compact card inline below.
 *
 * Data-link for hover-reveal:
 * ──────────────────────────
 * The schema does NOT explicitly link insights to the specific reflection
 * they derive from — `Insight.related_note_ids` points at journal_entries,
 * not at reflections. We fall back to *temporal proximity*: on hover of a
 * reflection, we highlight any insight whose `created_at` is within a
 * ±3 day window of that reflection's `created_at`. It is a heuristic, not
 * a guarantee — but it is deterministic and good enough to communicate
 * "this insight came from around this reflection." If / when the backend
 * adds an explicit `reflection_id` field on insights, swap the predicate
 * in `relatedInsightsFor()` below.
 *
 * Design constraints:
 *   – No external animation library (pure CSS + IntersectionObserver)
 *   – SSR-safe (all interactive state lives behind `use client`)
 *   – Accessible: dots carry aria-labels; hover-only effects are
 *     decorative and announced to assistive tech only via text content.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import ClientDate from "@/components/ClientDate";
import { useInViewFade } from "@/hooks/useInViewFade";
import {
  moodColor,
  insightTypeColor,
  reflectionSpineMood,
} from "@/lib/mood-palette";
import type { Reflection, Insight } from "@/lib/types";

// ───────────────────────── helpers ──────────────────────────

function previewBody(text: string, lines = 4) {
  const split = text.split("\n");
  if (split.length <= lines) return text;
  return `${split.slice(0, lines).join("\n").trim()}\n...`;
}

const TYPE_LABEL: Record<string, string> = {
  thread: "Thread",
  connection: "Connection",
  pattern: "Pattern",
  forgotten: "Forgotten",
  evolution: "Evolution",
};

// Milliseconds in 3 days — the temporal-proximity window used to infer
// "this insight probably came from around this reflection."
const PROXIMITY_MS = 3 * 24 * 60 * 60 * 1000;

type TimelineEvent =
  | { kind: "reflection"; at: number; r: Reflection }
  | { kind: "insight"; at: number; i: Insight };

function buildTimeline(
  reflections: Reflection[],
  insights: Insight[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...reflections.map<TimelineEvent>((r) => ({
      kind: "reflection",
      at: new Date(r.created_at).getTime(),
      r,
    })),
    ...insights.map<TimelineEvent>((i) => ({
      kind: "insight",
      at: new Date(i.created_at).getTime(),
      i,
    })),
  ];
  // Newest-first so the user lands on what's recent; older reflections/
  // insights trail downward. Matches the existing page rhythm.
  events.sort((a, b) => b.at - a.at);
  return events;
}

// ───────────────────────── props ──────────────────────────

interface TemporalSpineProps {
  reflections: Reflection[];
  insights: Insight[];
  /**
   * When true, reflection cards are inert (no /app/mirror/:id link). Used
   * for the /demo route where those routes are behind auth.
   */
  inert?: boolean;
}

export default function TemporalSpine({
  reflections,
  insights,
  inert = false,
}: TemporalSpineProps) {
  // Active reflection id drives the hover-reveal. We track it in state
  // rather than pure :hover because a related-insight dot also needs to
  // respond to its *reflection's* hover state, which is a sibling in the
  // DOM — CSS alone can't cross that boundary cleanly.
  const [activeReflectionId, setActiveReflectionId] = useState<string | null>(
    null
  );
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);

  const events = useMemo(
    () => buildTimeline(reflections, insights),
    [reflections, insights]
  );

  // Precompute reflection → related insight ids (temporal proximity).
  // Doing this once avoids O(n*m) work in the render path.
  const reflectionToInsightIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of reflections) {
      const rAt = new Date(r.created_at).getTime();
      const bucket = new Set<string>();
      for (const i of insights) {
        const iAt = new Date(i.created_at).getTime();
        if (Math.abs(iAt - rAt) <= PROXIMITY_MS) bucket.add(i.id);
      }
      map.set(r.id, bucket);
    }
    return map;
  }, [reflections, insights]);

  // And the inverse — an insight highlights reflections near it.
  const insightToReflectionIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const i of insights) {
      const iAt = new Date(i.created_at).getTime();
      const bucket = new Set<string>();
      for (const r of reflections) {
        const rAt = new Date(r.created_at).getTime();
        if (Math.abs(iAt - rAt) <= PROXIMITY_MS) bucket.add(r.id);
      }
      map.set(i.id, bucket);
    }
    return map;
  }, [reflections, insights]);

  // Compute dim/active state for a given id. When nothing is hovered, all
  // items render at full opacity. When something is hovered, items that
  // are NOT in the related set fade to 0.4.
  function reflectionIsActive(id: string): boolean {
    if (activeReflectionId === id) return true;
    if (
      activeInsightId &&
      insightToReflectionIds.get(activeInsightId)?.has(id)
    ) {
      return true;
    }
    return false;
  }
  function insightIsActive(id: string): boolean {
    if (activeInsightId === id) return true;
    if (
      activeReflectionId &&
      reflectionToInsightIds.get(activeReflectionId)?.has(id)
    ) {
      return true;
    }
    return false;
  }

  const hasHover = activeReflectionId !== null || activeInsightId !== null;

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-card-border bg-card p-8 text-center">
        <p className="text-sm text-warm-gray">
          Nothing on the spine yet. As reflections and insights appear, this
          is where they will braid together.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Temporal spine of reflections and insights" className="relative">
      {/* ─── The spine ──────────────────────────────────────────────
          A thin vertical line at ~12% opacity running the full height
          of the timeline. On mobile it sits at the left gutter (x=24px
          from the content edge). On desktop it sits dead-center so
          cards can alternate left / right around it. Positioned with
          CSS so it grows with the column. */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute top-0 bottom-0 w-px
          bg-[var(--spine-color)]
          left-[19px] md:left-1/2 md:-translate-x-1/2
        "
        style={{ ["--spine-color" as string]: "#E8A84922" }}
      />

      <ol className="relative space-y-4 md:space-y-6">
        {events.map((ev, idx) => (
          <SpineItem
            key={ev.kind === "reflection" ? ev.r.id : ev.i.id}
            event={ev}
            index={idx}
            inert={inert}
            dim={
              hasHover &&
              !(ev.kind === "reflection"
                ? reflectionIsActive(ev.r.id)
                : insightIsActive(ev.i.id))
            }
            onReflectionEnter={setActiveReflectionId}
            onReflectionLeave={() => setActiveReflectionId(null)}
            onInsightEnter={setActiveInsightId}
            onInsightLeave={() => setActiveInsightId(null)}
          />
        ))}
      </ol>
    </section>
  );
}

// ───────────────────────── item ──────────────────────────

interface SpineItemProps {
  event: TimelineEvent;
  index: number;
  inert: boolean;
  dim: boolean;
  onReflectionEnter: (id: string) => void;
  onReflectionLeave: () => void;
  onInsightEnter: (id: string) => void;
  onInsightLeave: () => void;
}

function SpineItem({
  event,
  index,
  inert,
  dim,
  onReflectionEnter,
  onReflectionLeave,
  onInsightEnter,
  onInsightLeave,
}: SpineItemProps) {
  // Stagger the reveal per item. Past ~12 items the stagger caps — no
  // point making late items wait forever.
  const delay = Math.min(index, 12) * 120;
  const { ref, inView } = useInViewFade<HTMLLIElement>({ delayMs: delay });

  // Side: alternate on desktop starting with right for newest (index 0).
  // On mobile this is ignored — cards always sit to the right of the
  // left-aligned spine.
  const side: "right" | "left" = index % 2 === 0 ? "right" : "left";

  const baseTransition =
    "transition-[opacity,transform] duration-700 ease-out";
  const revealClass = inView
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2";
  const dimClass = dim ? "opacity-40" : "";
  // When dim applies, override the reveal opacity-100 but keep the
  // translate. Ordering: inView sets opacity-100, then dimClass wins if
  // present. Tailwind just-in-time handles this via class order.

  if (event.kind === "reflection") {
    return (
      <li
        ref={ref}
        className={`relative ${baseTransition} ${revealClass} ${dimClass}`}
      >
        <ReflectionNode
          reflection={event.r}
          side={side}
          inert={inert}
          onEnter={onReflectionEnter}
          onLeave={onReflectionLeave}
        />
      </li>
    );
  }

  return (
    <li
      ref={ref}
      className={`relative ${baseTransition} ${revealClass} ${dimClass}`}
    >
      <InsightNode
        insight={event.i}
        onEnter={onInsightEnter}
        onLeave={onInsightLeave}
      />
    </li>
  );
}

// ───────────────────────── reflection node ──────────────────────────

interface ReflectionNodeProps {
  reflection: Reflection;
  side: "left" | "right";
  inert: boolean;
  onEnter: (id: string) => void;
  onLeave: () => void;
}

function ReflectionNode({
  reflection: r,
  side,
  inert,
  onEnter,
  onLeave,
}: ReflectionNodeProps) {
  const mood = reflectionSpineMood(r.reflection_type);
  const color = moodColor(mood);

  // Card content — shared between the Link + inert-article variants
  const cardInner = (
    <>
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-warm-gray-light">
        <span>
          {r.reflection_type === "on_demand" ? "on demand" : r.reflection_type}
        </span>
        <div className="flex items-center gap-2">
          {r.entry_count_at_generation != null && (
            <span>{r.entry_count_at_generation} entries</span>
          )}
          <ClientDate iso={r.created_at} format="date" />
        </div>
      </div>
      <h3
        className="mt-2 text-[17px] italic leading-snug text-foreground"
        style={{
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
        }}
      >
        {r.title}
      </h3>
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-warm-gray">
        {previewBody(r.body)}
      </p>
    </>
  );

  // Card wrapper — either a Link (authed /app/mirror) or an article (demo).
  const cardClass = `
    group/card block rounded-2xl border border-card-border bg-card p-5
    transition-all duration-300 ease-out
    hover:border-amber/40 hover:shadow-sm
  `;

  return (
    <div
      className="relative"
      onMouseEnter={() => onEnter(r.id)}
      onMouseLeave={onLeave}
      onFocus={() => onEnter(r.id)}
      onBlur={onLeave}
    >
      {/* Dot on the spine */}
      <span
        aria-label={`Reflection on ${new Date(r.created_at).toLocaleDateString(
          undefined,
          { month: "long", day: "numeric", year: "numeric" }
        )}, ${mood} tone`}
        className="
          absolute top-5 z-10 flex h-[14px] w-[14px] items-center justify-center rounded-full
          ring-4 ring-background transition-transform duration-300
          left-[13px] md:left-1/2 md:-translate-x-1/2
          group-hover/card:scale-110
        "
        style={{ backgroundColor: color }}
      />

      {/* Card — alternating side on desktop, right-of-spine on mobile */}
      <div
        className={`
          pl-12
          md:pl-0
          ${
            side === "right"
              ? "md:ml-[calc(50%+28px)] md:mr-0"
              : "md:mr-[calc(50%+28px)] md:ml-0"
          }
        `}
      >
        {inert ? (
          <article
            className={cardClass}
            style={{ borderLeft: `4px solid ${color}` }}
          >
            {cardInner}
          </article>
        ) : (
          <Link
            href={`/app/mirror/${r.id}`}
            className={cardClass}
            style={{ borderLeft: `4px solid ${color}` }}
          >
            {cardInner}
          </Link>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── insight node ──────────────────────────

interface InsightNodeProps {
  insight: Insight;
  onEnter: (id: string) => void;
  onLeave: () => void;
}

function InsightNode({ insight: i, onEnter, onLeave }: InsightNodeProps) {
  const color = insightTypeColor(i.insight_type);
  const typeLabel = TYPE_LABEL[i.insight_type] ?? i.insight_type;

  return (
    <div
      className="relative"
      onMouseEnter={() => onEnter(i.id)}
      onMouseLeave={onLeave}
      onFocus={() => onEnter(i.id)}
      onBlur={onLeave}
    >
      {/* Small dot on the spine */}
      <span
        aria-label={`${typeLabel} insight on ${new Date(
          i.created_at
        ).toLocaleDateString(undefined, { month: "long", day: "numeric" })}`}
        className="
          absolute top-3 z-10 h-[8px] w-[8px] rounded-full
          ring-[3px] ring-background transition-transform duration-300
          left-[16px] md:left-1/2 md:-translate-x-1/2
          group-hover/ins:scale-125
        "
        style={{ backgroundColor: color }}
      />

      {/* Compact inline card — renders narrow, below-dot, anchored right
          of the spine on all viewports. Insights are secondary to
          reflections; keeping them always on the right prevents the
          spine from turning into a chaotic two-column zigzag. */}
      <div className="pl-12 md:pl-0 md:ml-[calc(50%+28px)] md:max-w-[340px]">
        <article
          className="
            group/ins rounded-xl border border-card-border/70 bg-card/70 px-4 py-3
            transition-colors duration-300
            hover:border-amber/30
          "
          style={{ borderLeft: `2px solid ${color}` }}
        >
          <div className="flex items-baseline justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-warm-gray-light">
            <span style={{ color }}>{typeLabel}</span>
            <span>
              {new Date(i.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <h4 className="mt-1 text-[13px] font-semibold leading-snug text-foreground">
            {i.title}
          </h4>
          {i.description && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-warm-gray line-clamp-3">
              {i.description}
            </p>
          )}
        </article>
      </div>
    </div>
  );
}
