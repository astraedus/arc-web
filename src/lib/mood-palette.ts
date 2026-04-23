// Canonical mood palette for Arc. Kept in one place so the constellation,
// river-of-time, note editor, share card, and any future surface agree on
// what a mood looks like. If you add a new mood, add it here first —
// downstream UI (selector buttons, legends, node colors, OG cards) derives
// from this map.
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

// ─────────────────────────────────────────────────────────────────────────
// Share-card palette: four colors per mood for the 1200x630 OG image.
// These are derived extensions of MOOD_PALETTE — accent comes from the
// canonical map, while wash/foreground/muted are tuned so the card sits
// quietly on social feeds without fighting other posts around it.
// ─────────────────────────────────────────────────────────────────────────

export interface MoodSharePalette {
  /** Accent color — used for the top bar and inline glyphs. */
  accent: string;
  /** Subtle background wash for the card body. */
  wash: string;
  /** Foreground body text. */
  foreground: string;
  /** Muted metadata text (date, type, etc.). */
  muted: string;
}

export const NEUTRAL_SHARE_PALETTE: MoodSharePalette = {
  accent: "#E8A849", // canonical Arc amber (matches MOOD_PALETTE.hopeful)
  wash: "#FAFAF8",
  foreground: "#2B2822",
  muted: "#6B6560",
};

// Per-mood card palettes. Accent is MOOD_PALETTE[mood]; wash/foreground/muted
// are chosen per-mood to harmonize with that accent on a paper-ish card.
const SHARE_PALETTE_BY_MOOD: Record<string, MoodSharePalette> = {
  alive: {
    accent: MOOD_PALETTE.alive,
    wash: "#FFF3E2",
    foreground: "#2B1F15",
    muted: "#7A5B3D",
  },
  hopeful: {
    accent: MOOD_PALETTE.hopeful,
    wash: "#FAF5E8",
    foreground: "#2B2822",
    muted: "#6B6560",
  },
  steady: {
    accent: MOOD_PALETTE.steady,
    wash: "#F6F1E6",
    foreground: "#2B2419",
    muted: "#6E6045",
  },
  uncertain: {
    accent: MOOD_PALETTE.uncertain,
    wash: "#F1F3EC",
    foreground: "#242A20",
    muted: "#5F6B54",
  },
  struggling: {
    accent: MOOD_PALETTE.struggling,
    wash: "#EEF0F4",
    foreground: "#22293A",
    muted: "#5A6272",
  },
};

/**
 * Resolve a four-color share-card palette for the given mood tag.
 * Case-insensitive; unknown / null moods return the neutral amber default.
 */
export function getMoodSharePalette(mood?: string | null): MoodSharePalette {
  if (!mood) return NEUTRAL_SHARE_PALETTE;
  const key = mood.trim().toLowerCase();
  return SHARE_PALETTE_BY_MOOD[key] ?? NEUTRAL_SHARE_PALETTE;
}
