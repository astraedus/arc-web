"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { moodColor } from "@/lib/mood-palette";

// react-force-graph-2d uses window/canvas — must be dynamic.
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false }
);

type GraphEntryNode = {
  id: string;
  type: "entry";
  label: string;
  mood: string | null;
  themes: string[];
  date: string;
  size: number;
};
type GraphReflectionNode = {
  id: string;
  type: "reflection";
  label: string;
  rtype: string;
  date: string;
};
type GraphThemeNode = {
  id: string;
  type: "theme";
  label: string;
  count: number;
};
/**
 * Ghost theme node — a dashed, translucent placeholder that teaches the
 * user "a real theme will land here". Rendered only in State A (0 real
 * themes, the big lonely one) and State B (1-4 real themes, a few small
 * ones hovering on the outside). Dropped entirely in State C so the real
 * graph carries its own weight.
 */
type GhostNode = {
  id: string;
  type: "ghost";
  /** "anchor" = the big centered ghost used on State A. "satellite" = the
   * smaller ones used on State B to hint at growth room. */
  variant: "anchor" | "satellite";
  label: string;
};
type GraphNode =
  | GraphEntryNode
  | GraphReflectionNode
  | GraphThemeNode
  | GhostNode;
type GraphLink = {
  source: string;
  target: string;
  kind: "echo" | "theme" | "reflection";
};

export type ConstellationProps = {
  entries: Array<{
    id: string;
    content: string;
    created_at: string;
    mood_tag: string | null;
    theme_tags: string[] | null;
  }>;
  echoes: Array<{ source_entry_id: string; echo_entry_id: string }>;
  reflections: Array<{
    id: string;
    title: string;
    reflection_type: string;
    created_at: string;
  }>;
};

function snippet(text: string, max = 200) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

/** Min theme count (themes appearing in >= 2 entries) at which the
 * constellation is "full enough" — no more ghosts, real graph carries
 * itself. Mirrors the progressive-reveal thresholds chosen for /mirror. */
const FULL_THRESHOLD = 5;
/** How many satellite ghost nodes to add when in State B. Gives the user
 * a sense of "room to grow" without cluttering the canvas. */
const SATELLITE_COUNT = 3;

export default function Constellation({
  entries,
  echoes,
  reflections,
}: ConstellationProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hover, setHover] = useState<
    | { type: "entry"; id: string; label: string; date: string; mood: string | null }
    | { type: "reflection"; id: string; label: string; date: string; rtype: string }
    | { type: "theme"; id: string; label: string; count: number }
    | null
  >(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ width: cr.width, height: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build graph data
  const data = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const themeCounts = new Map<string, number>();
    const themeToEntries = new Map<string, string[]>();

    for (const e of entries) {
      const sz = Math.max(3, Math.min(14, 3 + (e.content?.length ?? 0) / 200));
      nodes.push({
        id: `e:${e.id}`,
        type: "entry",
        label: snippet(e.content ?? "", 80),
        mood: e.mood_tag,
        themes: e.theme_tags ?? [],
        date: e.created_at,
        size: sz,
      });
      for (const t of e.theme_tags ?? []) {
        themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
        const arr = themeToEntries.get(t) ?? [];
        arr.push(e.id);
        themeToEntries.set(t, arr);
      }
    }

    // Theme nodes (only if used by 2+ entries — keeps graph clean)
    let renderedThemeCount = 0;
    for (const [theme, count] of themeCounts.entries()) {
      if (count < 2) continue;
      renderedThemeCount += 1;
      const tid = `t:${theme}`;
      nodes.push({ id: tid, type: "theme", label: theme, count });
      for (const eid of themeToEntries.get(theme) ?? []) {
        links.push({ source: tid, target: `e:${eid}`, kind: "theme" });
      }
    }

    // Reflection nodes — connected to recent entries (linked by recency, lacking strict citation data)
    for (const r of reflections) {
      const rid = `r:${r.id}`;
      nodes.push({
        id: rid,
        type: "reflection",
        label: r.title,
        rtype: r.reflection_type,
        date: r.created_at,
      });
      // Link reflection to up to 5 entries created in the period it covers
      const refTime = new Date(r.created_at).getTime();
      const window = 7 * 24 * 60 * 60 * 1000; // 7 days back
      const linked = entries
        .filter((e) => {
          const t = new Date(e.created_at).getTime();
          return t < refTime && refTime - t <= window;
        })
        .slice(0, 5);
      for (const e of linked) {
        links.push({ source: rid, target: `e:${e.id}`, kind: "reflection" });
      }
    }

    // Echo edges
    const knownNodeIds = new Set(nodes.map((n) => n.id));
    for (const ec of echoes) {
      const a = `e:${ec.source_entry_id}`;
      const b = `e:${ec.echo_entry_id}`;
      if (knownNodeIds.has(a) && knownNodeIds.has(b)) {
        links.push({ source: a, target: b, kind: "echo" });
      }
    }

    /* ──────────────── Progressive reveal: ghost nodes ────────────────
     *
     * State A (0 rendered themes): show a single big ANCHOR ghost at
     *   center, plus a full-page soft overlay with the "your first
     *   theme will appear here" copy + CTA. The anchor gives the force
     *   graph something non-empty to render so the canvas doesn't look
     *   broken.
     * State B (1 to FULL_THRESHOLD-1 rendered themes): real themes are
     *   present; layer SATELLITE_COUNT small ghost satellites around
     *   them with "upcoming" labels to hint at growth.
     * State C (>= FULL_THRESHOLD rendered themes): no ghosts, no
     *   overlay — real graph carries its own weight.
     *
     * Ghost nodes are tagged type "ghost" so hover handlers + click
     * handlers ignore them cleanly (they are not routable, not
     * hoverable — they exist only to shape the visual).
     */
    let state: "A" | "B" | "C";
    if (renderedThemeCount === 0) state = "A";
    else if (renderedThemeCount < FULL_THRESHOLD) state = "B";
    else state = "C";

    if (state === "A") {
      nodes.push({
        id: "g:anchor",
        type: "ghost",
        variant: "anchor",
        label: "Your themes",
      });
    } else if (state === "B") {
      for (let i = 0; i < SATELLITE_COUNT; i += 1) {
        nodes.push({
          id: `g:sat:${i}`,
          type: "ghost",
          variant: "satellite",
          label: "upcoming",
        });
      }
    }

    return { nodes, links, state, renderedThemeCount };
  }, [entries, echoes, reflections]);

  function nodeColor(node: GraphNode) {
    if (node.type === "entry") return moodColor(node.mood);
    if (node.type === "reflection") return "#C88B2E"; // amber-dark
    if (node.type === "theme") return "#9B9590"; // theme = warm-gray-light
    return "rgba(0, 0, 0, 0)"; // ghost — drawn manually, make stock fill invisible
  }

  function nodeRadius(node: GraphNode) {
    if (node.type === "entry") return node.size;
    if (node.type === "reflection") return 8;
    if (node.type === "theme") return Math.max(4, Math.min(16, 4 + node.count * 1.5));
    // ghost
    if (node.variant === "anchor") return 22;
    return 7;
  }

  /** Draws a ghost node: dashed circle outline, warm-gray, translucent,
   * with a caption underneath. No fill — the point is it reads as a
   * placeholder, not a real data point. */
  function drawGhost(
    node: GhostNode,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
    x: number,
    y: number
  ) {
    const r = nodeRadius(node);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "#9B9590";
    ctx.lineWidth = node.variant === "anchor" ? 1.6 : 1.2;
    // Dash pattern scales slightly with globalScale so it reads at any zoom.
    const dash = node.variant === "anchor" ? [4, 3] : [2.5, 2];
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Caption
    const fontSize =
      node.variant === "anchor"
        ? Math.max(11, 13 / globalScale)
        : Math.max(9, 10 / globalScale);
    ctx.font = `${node.variant === "anchor" ? "500" : "400"} ${fontSize}px ui-sans-serif, system-ui`;
    ctx.fillStyle = "#6B6560";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.globalAlpha = node.variant === "anchor" ? 0.7 : 0.55;
    ctx.fillText(node.label, x, y + r + 3);
    ctx.restore();
  }

  const showOverlay = data.state === "A";

  return (
    <div className="relative h-[calc(100vh-220px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-card-border bg-card">
      <div ref={containerRef} className="absolute inset-0">
        <ForceGraph2D
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="#FAFAF8"
          nodeRelSize={1}
          // @ts-expect-error - lib types are loose
          nodeVal={(n) => Math.pow(nodeRadius(n), 2)}
          // @ts-expect-error - lib types are loose
          nodeColor={(n) => nodeColor(n)}
          nodePointerAreaPaint={(rawNode, paintColor, ctx) => {
            const n = rawNode as unknown as GraphNode;
            // Ghost nodes should not be clickable / hoverable — skipping the
            // paint removes them from the interaction mask entirely.
            if (n.type === "ghost") return;
            const positioned = rawNode as { x?: number; y?: number };
            const r = nodeRadius(n);
            ctx.fillStyle = paintColor;
            ctx.beginPath();
            ctx.arc(positioned.x ?? 0, positioned.y ?? 0, r, 0, Math.PI * 2);
            ctx.fill();
          }}
          enableNodeDrag={false}
          enablePointerInteraction={true}
          warmupTicks={50}
          linkColor={(l) => {
            if ((l as GraphLink).kind === "echo") return "rgba(232, 168, 73, 0.45)";
            if ((l as GraphLink).kind === "reflection") return "rgba(200, 139, 46, 0.20)";
            return "rgba(155, 149, 144, 0.12)";
          }}
          linkWidth={(l) => ((l as GraphLink).kind === "echo" ? 1.4 : 0.8)}
          cooldownTicks={120}
          onNodeHover={(node) => {
            if (typeof document !== "undefined") {
              document.body.style.cursor = node ? "pointer" : "default";
            }
            if (!node) {
              setHoveredId(null);
              setHover(null);
              return;
            }
            const n = node as GraphNode;
            // Ghosts aren't interactive.
            if (n.type === "ghost") {
              setHoveredId(null);
              setHover(null);
              if (typeof document !== "undefined") {
                document.body.style.cursor = "default";
              }
              return;
            }
            setHoveredId(n.id);
            if (n.type === "entry") {
              setHover({
                type: "entry",
                id: n.id,
                label: n.label,
                date: n.date,
                mood: n.mood,
              });
            } else if (n.type === "reflection") {
              setHover({
                type: "reflection",
                id: n.id,
                label: n.label,
                date: n.date,
                rtype: n.rtype,
              });
            } else {
              setHover({ type: "theme", id: n.id, label: n.label, count: n.count });
            }
          }}
          onNodeClick={(node) => {
            const raw = (node as { id?: string })?.id ?? "";
            // Strip our prefix and route based on it. Defensive: log if unexpected.
            if (raw.startsWith("e:")) {
              router.push(`/app/notes/${raw.slice(2)}`);
            } else if (raw.startsWith("r:")) {
              router.push(`/app/mirror/${raw.slice(2)}`);
            } else if (raw.startsWith("g:")) {
              // Ghost node clicked — take it as a hint they want to start
              // writing. Mirrors the empty-state CTA.
              router.push("/app/new");
            } else if (typeof console !== "undefined") {
              console.log("[Constellation] click on non-routable node:", raw);
            }
          }}
          onBackgroundClick={() => {
            setHoveredId(null);
            setHover(null);
          }}
          nodeCanvasObjectMode={(node) => {
            const n = node as GraphNode;
            // Ghosts: fully custom render (replace the default filled circle).
            if (n.type === "ghost") return "replace";
            // Always label themes (they're the navigational anchors)
            if (n.type === "theme") return "after";
            // Otherwise only label the currently-hovered node
            return n.id === hoveredId ? "after" : undefined;
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode;
            const positioned = node as { x?: number; y?: number };
            const x = positioned.x ?? 0;
            const y = positioned.y ?? 0;

            if (n.type === "ghost") {
              drawGhost(n, ctx, globalScale, x, y);
              return;
            }

            const isHovered = n.id === hoveredId;
            const fontSize =
              n.type === "theme"
                ? Math.max(10, 11 / globalScale)
                : Math.max(11, 12 / globalScale);
            ctx.font = `${n.type === "theme" ? "600" : isHovered ? "500" : "400"} ${fontSize}px ui-sans-serif, system-ui`;
            ctx.fillStyle = n.type === "theme" ? "#6B6560" : "#2B2822";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const r = nodeRadius(n);
            const label =
              n.type === "theme"
                ? n.label
                : n.label.length > 60
                  ? n.label.slice(0, 60) + "..."
                  : n.label;
            // Subtle background pill on hover so labels read against any color
            if (isHovered) {
              const w = ctx.measureText(label).width;
              ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
              ctx.fillRect(x - w / 2 - 4, y + r + 1, w + 8, fontSize + 4);
              ctx.fillStyle = "#2B2822";
            }
            ctx.fillText(label, x, y + r + 3);
          }}
        />
      </div>

      {/* Empty-state overlay — State A only. Soft, not a takeover. Sits
          underneath the canvas visually (pointer-events only on the CTA
          so the ghost node underneath stays clickable if the user wants
          that route too). */}
      {showOverlay && (
        <div
          role="status"
          aria-label="Your constellation is empty — your first theme will appear here as you write"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 flex flex-col items-center justify-start px-6 pt-24 text-center"
        >
          <p className="max-w-sm text-sm italic leading-relaxed text-warm-gray">
            Your first theme will appear here as you write.
          </p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-warm-gray-light">
            Each entry adds a thread. Echoes connect across time.
          </p>
          <Link
            href="/app/new"
            className="pointer-events-auto mt-6 inline-flex items-center rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
          >
            Write your first entry →
          </Link>
        </div>
      )}

      {/* State B nudge — small, bottom-left, non-intrusive. Appears once
          there are real themes but not enough for the graph to feel full. */}
      {data.state === "B" && (
        <div
          role="status"
          aria-label="Your constellation is starting"
          className="pointer-events-none absolute left-4 bottom-4 max-w-xs rounded-xl border border-dashed border-card-border bg-card/85 p-3 text-xs italic leading-relaxed text-warm-gray backdrop-blur-sm"
        >
          Your constellation is starting. Each new entry threads in.
        </div>
      )}

      {/* Hover tooltip */}
      {hover && (
        <div className="pointer-events-none absolute left-4 top-4 max-w-sm rounded-xl border border-card-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-warm-gray-light">
            <span>{hover.type}</span>
            {hover.type === "entry" && hover.mood && (
              <span className="text-amber-dark">{hover.mood}</span>
            )}
            {hover.type === "reflection" && (
              <span className="text-amber-dark">{hover.rtype}</span>
            )}
            {hover.type === "theme" && (
              <span>{hover.count} entries</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground line-clamp-4">
            {hover.label}
          </p>
          {(hover.type === "entry" || hover.type === "reflection") && (
            <p className="mt-2 text-xs text-warm-gray-light">
              {new Date(hover.date).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Accessibility-only ghost summary — screen readers get the
          upcoming-theme count without the canvas needing any extra DOM
          per ghost. Rendered only when ghosts are actually in the graph. */}
      {(data.state === "A" || data.state === "B") && (
        <ul className="sr-only" aria-label="upcoming themes">
          {data.state === "A" && (
            <li aria-label="upcoming theme — your first theme will appear here as you write">
              upcoming theme anchor
            </li>
          )}
          {data.state === "B" &&
            Array.from({ length: SATELLITE_COUNT }).map((_, i) => (
              <li key={i} aria-label="upcoming theme">
                upcoming theme satellite {i + 1}
              </li>
            ))}
        </ul>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 rounded-xl border border-card-border bg-card/90 p-3 text-xs text-warm-gray backdrop-blur-sm">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-warm-gray-light">
          legend
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "#F5A623" }}
            />
            <span>entry (size = length)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "#C88B2E" }}
            />
            <span>reflection</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "#9B9590" }}
            />
            <span>theme</span>
          </div>
          <div className="mt-2 border-t border-card-border pt-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-px w-6"
                style={{ background: "rgba(232, 168, 73, 0.7)" }}
              />
              <span>echo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
