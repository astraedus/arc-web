/**
 * Maps a reflection's mood tag to palette colours used by the share card.
 * Colours are tuned for the warm off-white Arc paper theme — each mood picks
 * a subtle accent bar colour and a card wash that still sits comfortably next
 * to the canonical amber brand tone.
 *
 * All values are static strings (no Tailwind JIT at runtime) so they can be
 * embedded directly inside the `next/og` ImageResponse renderer.
 */

export interface MoodPalette {
  /** Accent colour — used for the top bar and inline glyphs. */
  accent: string;
  /** Subtle background wash for the card body. */
  wash: string;
  /** Foreground body text. */
  foreground: string;
  /** Muted metadata text (date, type, etc.). */
  muted: string;
}

export const NEUTRAL_MOOD_PALETTE: MoodPalette = {
  accent: "#E8A849", // canonical Arc amber
  wash: "#FAFAF8",
  foreground: "#2B2822",
  muted: "#6B6560",
};

const PALETTE_BY_MOOD: Record<string, MoodPalette> = {
  joy: {
    accent: "#E8A849",
    wash: "#FFF6E4",
    foreground: "#2B2822",
    muted: "#7A6E55",
  },
  hope: {
    accent: "#E8A849",
    wash: "#FAF5E8",
    foreground: "#2B2822",
    muted: "#6B6560",
  },
  calm: {
    accent: "#8BB7A8",
    wash: "#F1F7F3",
    foreground: "#26332E",
    muted: "#62756D",
  },
  grief: {
    accent: "#6F7A9C",
    wash: "#EEF0F6",
    foreground: "#20253B",
    muted: "#5A6178",
  },
  sadness: {
    accent: "#6F7A9C",
    wash: "#EEF0F6",
    foreground: "#20253B",
    muted: "#5A6178",
  },
  anger: {
    accent: "#C7603F",
    wash: "#FBEFEA",
    foreground: "#30201B",
    muted: "#7A5448",
  },
  anxious: {
    accent: "#B07FB7",
    wash: "#F5EEF6",
    foreground: "#2C2330",
    muted: "#6E5E72",
  },
  restless: {
    accent: "#B07FB7",
    wash: "#F5EEF6",
    foreground: "#2C2330",
    muted: "#6E5E72",
  },
  love: {
    accent: "#D47B8F",
    wash: "#FBEEF1",
    foreground: "#2D2124",
    muted: "#7A5A62",
  },
  gratitude: {
    accent: "#C88B2E",
    wash: "#FBF3E0",
    foreground: "#2B2822",
    muted: "#6B6560",
  },
};

/**
 * Resolve a palette for the given mood tag. Case-insensitive; unknown moods
 * (and null/empty) return the neutral amber default.
 */
export function getMoodPalette(mood?: string | null): MoodPalette {
  if (!mood) return NEUTRAL_MOOD_PALETTE;
  const key = mood.trim().toLowerCase();
  return PALETTE_BY_MOOD[key] ?? NEUTRAL_MOOD_PALETTE;
}
