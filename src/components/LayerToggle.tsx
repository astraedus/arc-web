"use client";

/**
 * LayerToggle — pill-group filter for the Mirror's temporal spine.
 *
 * Lets the user choose which layer of the Mirror to render:
 *   – All         → the woven stream (reflections + insights, current default)
 *   – Entries     → raw journal entries, chronological
 *   – Reflections → only reflection cards (weekly / on_demand / etc)
 *   – Insights    → only insight cards (threads, patterns, forgotten)
 *
 * This is the page-level "Obsidian view switcher" Anti asked for — users
 * should be able to see raw thoughts vs processed thoughts on the same
 * surface, without leaving the Mirror.
 *
 * Accessibility:
 *   – Renders as role="tablist" with role="tab" buttons + aria-selected.
 *   – Keyboard: Tab into the group; arrow keys are NOT wired yet (can be
 *     added later) since each tab is also a clickable button — a
 *     single-tab-stop pattern is the WAI-ARIA fallback for this variant.
 */

import type { Layer } from "@/lib/spine-layer";

const LAYERS: Array<{ key: Layer; label: string; hint: string }> = [
  { key: "all", label: "All", hint: "Reflections and insights, woven together" },
  { key: "entries", label: "Entries", hint: "Your raw journal entries" },
  { key: "reflections", label: "Reflections", hint: "Weekly and on-demand reflections" },
  { key: "insights", label: "Insights", hint: "Patterns, threads, and connections" },
];

interface LayerToggleProps {
  value: Layer;
  onChange: (next: Layer) => void;
  /**
   * Optional counts — when provided, rendered as a small trailing number
   * on each tab so users can see at a glance how much is in each layer.
   */
  counts?: Partial<Record<Layer, number>>;
}

export default function LayerToggle({ value, onChange, counts }: LayerToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Mirror layer"
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-card-border bg-card p-1"
    >
      {LAYERS.map((layer) => {
        const selected = value === layer.key;
        const count = counts?.[layer.key];
        return (
          <button
            key={layer.key}
            type="button"
            role="tab"
            aria-selected={selected}
            title={layer.hint}
            onClick={() => onChange(layer.key)}
            className={[
              "rounded-full px-3 py-1 text-[12px] transition-colors duration-200",
              selected
                ? "bg-amber/15 text-amber-dark font-medium"
                : "text-warm-gray hover:text-foreground",
            ].join(" ")}
          >
            <span>{layer.label}</span>
            {typeof count === "number" ? (
              <span
                className={[
                  "ml-1.5 text-[10px]",
                  selected ? "text-amber-dark/70" : "text-warm-gray-light",
                ].join(" ")}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
