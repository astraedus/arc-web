import type { Reflection } from "@/lib/types";

/**
 * Defensive check: is this reflection safe to render on a public surface?
 *
 * The current `Reflection` type has no `protected` column, so we look at both:
 *  - a top-level boolean `protected` field (forward-compat for schema changes)
 *  - `metadata.protected === true`
 *
 * Anything truthy means NOT shareable — error on the side of privacy.
 */
export function isReflectionShareable(reflection: Reflection | null | undefined): boolean {
  if (!reflection) return false;

  // Forward-compatible: if the row has a top-level `protected` column, honour it.
  const withProtected = reflection as Reflection & { protected?: unknown };
  if (withProtected.protected === true) return false;

  const metaProtected =
    reflection.metadata && typeof reflection.metadata === "object"
      ? (reflection.metadata as Record<string, unknown>).protected
      : undefined;

  if (metaProtected === true) return false;

  return true;
}
