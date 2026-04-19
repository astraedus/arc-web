"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

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

const MOOD_PALETTE: Record<string, string> = {
  alive: "#F5A623",
  hopeful: "#FFC785",
  steady: "#E8DDC3",
  uncertain: "#A8B89A",
  struggling: "#7B92A8",
};

function moodColor(mood: string | null): string {
  if (!mood) return "#E8DDC3";
  const k = mood.toLowerCase();
  return MOOD_PALETTE[k] ?? "#E8DDC3";
}

function snippet(text: string, max = 200) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

export default function Constellation({
  entries,
  echoes,
  reflections,
}: ConstellationProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
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
    const nodes: Array<GraphEntryNode | GraphReflectionNode | GraphThemeNode> = [];
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
    for (const [theme, count] of themeCounts.entries()) {
      if (count < 2) continue;
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

    return { nodes, links };
  }, [entries, echoes, reflections]);

  function nodeColor(node: GraphEntryNode | GraphReflectionNode | GraphThemeNode) {
    if (node.type === "entry") return moodColor(node.mood);
    if (node.type === "reflection") return "#C88B2E"; // amber-dark
    return "#9B9590"; // theme = warm-gray-light
  }

  function nodeRadius(node: GraphEntryNode | GraphReflectionNode | GraphThemeNode) {
    if (node.type === "entry") return node.size;
    if (node.type === "reflection") return 8;
    if (node.type === "theme") return Math.max(4, Math.min(16, 4 + node.count * 1.5));
    return 5;
  }

  return (
    <div className="relative h-[calc(100vh-220px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-card-border bg-card">
      <div ref={containerRef} className="absolute inset-0">
        <ForceGraph2D
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="#FAFAF8"
          nodeRelSize={6}
          // @ts-expect-error - lib types are loose
          nodeVal={(n) => Math.pow(nodeRadius(n) / 4, 2)}
          // @ts-expect-error - lib types are loose
          nodeColor={(n) => nodeColor(n)}
          enableNodeDrag={false}
          enablePointerInteraction={true}
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
              setHover(null);
              return;
            }
            const n = node as
              | GraphEntryNode
              | GraphReflectionNode
              | GraphThemeNode;
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
            const n = node as
              | GraphEntryNode
              | GraphReflectionNode
              | GraphThemeNode;
            if (n.type === "entry") {
              router.push(`/app/notes/${n.id.replace(/^e:/, "")}`);
            } else if (n.type === "reflection") {
              router.push(`/app/mirror/${n.id.replace(/^r:/, "")}`);
            }
          }}
          onBackgroundClick={() => setHover(null)}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as
              | GraphEntryNode
              | GraphReflectionNode
              | GraphThemeNode;
            // Only label themes always; entries/reflections only when zoomed in
            if (n.type !== "theme" && globalScale < 1.4) return;
            const fontSize =
              n.type === "theme" ? 11 / globalScale : 10 / globalScale;
            ctx.font = `${n.type === "theme" ? "600" : "400"} ${fontSize}px ui-sans-serif, system-ui`;
            ctx.fillStyle = n.type === "theme" ? "#6B6560" : "#2B2822";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const r = nodeRadius(n);
            const positioned = node as { x?: number; y?: number };
            ctx.fillText(
              n.label,
              positioned.x ?? 0,
              (positioned.y ?? 0) + r + 2
            );
          }}
        />
      </div>

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
