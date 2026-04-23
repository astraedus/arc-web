/**
 * Layer — which slice of the Mirror's spine to render.
 *
 *   all         → reflections + insights woven together (current default)
 *   entries     → raw journal entries (chronological)
 *   reflections → only reflections
 *   insights    → only insights
 *
 * Kept in its own tiny module so both `TemporalSpine`, `MirrorClient`,
 * `DemoMirrorClient`, and `LayerToggle` can share the type without
 * creating a circular import between client components.
 */
export type Layer = "all" | "entries" | "reflections" | "insights";

export const DEFAULT_LAYER: Layer = "all";

/**
 * Tolerant parser for the ?layer=... URL parameter. Anything we don't
 * recognize collapses to DEFAULT_LAYER so the URL is never a source of
 * runtime errors.
 */
export function parseLayer(raw: string | null | undefined): Layer {
  if (!raw) return DEFAULT_LAYER;
  const v = raw.toLowerCase();
  if (v === "all" || v === "entries" || v === "reflections" || v === "insights") {
    return v;
  }
  return DEFAULT_LAYER;
}
