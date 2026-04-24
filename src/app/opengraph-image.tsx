import { ImageResponse } from "next/og";

// Image metadata — Next.js reads these to emit <meta> tags at build time.
export const alt = "Arc Mirror — a diary that reads you back.";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

// Node runtime (matches the existing /api/og route in this repo). Avoids
// Edge runtime gotchas and stays consistent with the rest of the app.
export const runtime = "nodejs";

// Brand tokens. Duplicated from @/lib/mood-palette intentionally — this
// route renders at build time and we want it to be self-contained if that
// module ever moves.
const BG = "#FAFAF8";
const FG = "#2B2822";
const MUTED = "#6B6560";
const AMBER = "#E8A849";
const CARD_BORDER = "#F0EDE8";

// Fonts. Satori (next/og's rendering engine) only bundles Noto Sans by
// default — a "serif" fallback stack renders as sans, not serif. To get a
// genuine display serif for "Arc Mirror" we fetch Playfair Display at
// build time. The whole image route is statically cached by Next, so the
// font is pulled once per deploy, not per request.
//
// Strategy:
//   1. Ask Google's css2 endpoint for the font-face declarations.
//   2. Parse out the TTF URLs (one for italic 400, one for upright 400
//      which we use for the "ARC" kicker label if serif is requested).
//   3. Fetch the TTFs as ArrayBuffers and hand them to ImageResponse.
//
// If the fetch fails (DNS, network, 404), we fall back gracefully to the
// serif family string; Satori will render Noto Sans but the image will
// still ship rather than blowing up the build.
const SERIF = "Playfair Display";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

const GOOGLE_FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&display=swap";

async function loadPlayfair(): Promise<
  Array<{ name: string; data: ArrayBuffer; style: "normal" | "italic"; weight: 400 }>
> {
  try {
    const cssRes = await fetch(GOOGLE_FONT_CSS_URL, {
      // A real UA is required; the default Node UA serves a variable-font
      // CSS variant that points at woff2 files Satori can't parse.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; arc-og/1.0; +https://arc-web-pi.vercel.app)",
      },
    });
    if (!cssRes.ok) return [];
    const css = await cssRes.text();

    // Extract the italic 400 and normal 400 TTF URLs in declaration order.
    const faces: Array<{ style: "normal" | "italic"; url: string }> = [];
    const faceRegex = /@font-face\s*\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = faceRegex.exec(css)) !== null) {
      const block = match[1];
      const styleMatch = block.match(/font-style:\s*(italic|normal)/);
      const weightMatch = block.match(/font-weight:\s*(\d+)/);
      const urlMatch = block.match(/url\((https:[^)]+\.ttf)\)/);
      if (!styleMatch || !weightMatch || !urlMatch) continue;
      if (weightMatch[1] !== "400") continue;
      faces.push({ style: styleMatch[1] as "normal" | "italic", url: urlMatch[1] });
    }

    const loaded = await Promise.all(
      faces.map(async (f) => {
        const fontRes = await fetch(f.url);
        if (!fontRes.ok) return null;
        const data = await fontRes.arrayBuffer();
        return {
          name: SERIF,
          data,
          style: f.style,
          weight: 400 as const,
        };
      })
    );
    return loaded.filter((x): x is NonNullable<typeof x> => x !== null);
  } catch {
    return [];
  }
}

export default async function Image() {
  const fonts = await loadPlayfair();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          fontFamily: SERIF,
          padding: "88px 104px",
          position: "relative",
        }}
      >
        {/* Decorative arc — single thin quarter-circle in amber, top-right.
            Echoes the product name without being literal. Rendered as an
            absolutely-positioned SVG so it doesn't disturb the flex column. */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            display: "flex",
          }}
        >
          <svg
            width="520"
            height="520"
            viewBox="0 0 520 520"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="260"
              cy="260"
              r="230"
              fill="none"
              stroke={AMBER}
              strokeWidth="3"
              opacity="0.55"
            />
            <circle
              cx="260"
              cy="260"
              r="180"
              fill="none"
              stroke={AMBER}
              strokeWidth="1.5"
              opacity="0.28"
            />
          </svg>
        </div>

        {/* Kicker: small letterspaced uppercase "ARC" — signals the brand
            without competing with the title. Sans so it reads as a label. */}
        <div
          style={{
            display: "flex",
            fontFamily: SANS,
            fontSize: 22,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          Arc
        </div>

        {/* Main stack — large italic serif "Arc Mirror" over subhead. Flex
            column pushed toward vertical center by a flex-grow spacer. */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 156,
              fontStyle: "italic",
              color: FG,
              lineHeight: 1.0,
              letterSpacing: -4,
            }}
          >
            Arc Mirror
          </div>

          {/* Amber underline: thin, short, sits just under the wordmark's
              right edge. Physical presence of the brand accent without
              becoming decoration. */}
          <div
            style={{
              display: "flex",
              marginTop: 28,
              height: 3,
              width: 140,
              backgroundColor: AMBER,
              borderRadius: 2,
            }}
          />

          <div
            style={{
              display: "flex",
              marginTop: 44,
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 42,
              color: MUTED,
              lineHeight: 1.35,
              maxWidth: 860,
            }}
          >
            a diary that reads you back.
          </div>
        </div>

        {/* Footer row: wordmark right, hairline divider above. Very subtle —
            the URL is a signature, not a headline. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              height: 1,
              backgroundColor: CARD_BORDER,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              color: MUTED,
              fontFamily: SANS,
            }}
          >
            <span style={{ fontSize: 22, letterSpacing: 2 }}>
              honest journaling
            </span>
            <span style={{ fontSize: 22, letterSpacing: 2 }}>
              astraedus.dev
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // Pass loaded fonts if available. Empty array is valid — Satori then
      // falls through to its bundled Noto Sans for everything.
      fonts: fonts.length
        ? fonts.map((f) => ({
            name: f.name,
            data: f.data,
            style: f.style,
            weight: f.weight,
          }))
        : undefined,
      // Cache at the edge for an hour, SWR for a day — matches the existing
      // /api/og route's policy.
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
