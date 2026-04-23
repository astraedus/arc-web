// Canonical mood palette for Arc. Kept in one place so the constellation,
// river-of-time, note editor, and any future surface agree on what a mood
// looks like. If you add a new mood, add it here first — downstream UI
// (selector buttons, legends, node colors) derives from this map.
//
// Colors chosen to stay legible on the cream-paper canvas background. See
// ops history (2026-04 palette audit) for rationale if you're tempted to
// retune these.

export const MOOD_PALETTE: Record<string, string> = {
  alive: "#D97706",      // amber-600 (darker, vibrant)
  hopeful: "#E8A849",    // amber accent
  steady: "#A88B5C",     // muted bronze (visible on cream)
  uncertain: "#7C8E6B",  // moss
  struggling: "#5A748F", // dusty blue
};

// Fallback used when a mood is missing or unknown. Matches the "steady"
// bronze — neutral enough to blend, dark enough to read.
export const MOOD_FALLBACK_COLOR = "#A88B5C";

export function moodColor(mood: string | null | undefined): string {
  if (!mood) return MOOD_FALLBACK_COLOR;
  return MOOD_PALETTE[mood.toLowerCase()] ?? MOOD_FALLBACK_COLOR;
}

// Display order for the mood selector UI, low-energy → high-energy.
// Changing this order changes the on-screen order of the chips in the
// create-note form.
export const MOOD_ORDER: Array<keyof typeof MOOD_PALETTE> = [
  "struggling",
  "uncertain",
  "steady",
  "hopeful",
  "alive",
];

export type MoodOption = {
  key: string;
  label: string;
  color: string;
};

// Derived list for the selector. The label currently mirrors the key, but
// kept as a separate field so we can localize / rename later without
// touching every call-site.
export const MOOD_OPTIONS: MoodOption[] = MOOD_ORDER.map((key) => ({
  key,
  label: key,
  color: MOOD_PALETTE[key],
}));
