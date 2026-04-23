import { ImageResponse } from "next/og";
import { NEUTRAL_MOOD_PALETTE } from "@/lib/mood-palette";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 } as const;
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";

export async function GET() {
  const palette = NEUTRAL_MOOD_PALETTE;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: palette.wash,
          fontFamily: SERIF,
          padding: "80px 96px",
        }}
      >
        {/* Top amber bar */}
        <div
          style={{
            display: "flex",
            height: 10,
            width: "100%",
            backgroundColor: palette.accent,
            borderRadius: 5,
            opacity: 0.9,
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <div
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: palette.muted,
            }}
          >
            Arc
          </div>
          <div
            style={{
              fontSize: 108,
              fontStyle: "italic",
              color: palette.foreground,
              lineHeight: 1.05,
              marginTop: 28,
              letterSpacing: -2,
            }}
          >
            An honest diary,
          </div>
          <div
            style={{
              fontSize: 108,
              fontStyle: "italic",
              color: palette.accent,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            reflected back.
          </div>
          <div
            style={{
              marginTop: 40,
              fontFamily: "system-ui, sans-serif",
              fontSize: 28,
              color: palette.muted,
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Write it down. Let the Mirror read it back — longitudinally, gently,
            without a feed.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: palette.muted,
            fontFamily: "system-ui, sans-serif",
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>arc.app</span>
          <span>The Mirror · The Graph · The River</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
