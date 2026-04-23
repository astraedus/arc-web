import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getMoodPalette, NEUTRAL_MOOD_PALETTE } from "@/lib/mood-palette";
import { isReflectionShareable } from "@/lib/reflection-visibility";
import { makeReflectionExcerpt } from "@/lib/reflection-excerpt";
import type { Reflection } from "@/lib/types";

// Node runtime — Satori + resvg are CPU-heavy and the rest of this app already
// runs on Node. Keeps Sentry/env loading paths uniform.
export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 } as const;
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function resolveMood(reflection: Reflection): string | null {
  const metaMood =
    reflection.metadata && typeof reflection.metadata === "object"
      ? (reflection.metadata as Record<string, unknown>).mood
      : undefined;
  return typeof metaMood === "string" && metaMood.length > 0 ? metaMood : null;
}

function privateCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: NEUTRAL_MOOD_PALETTE.wash,
          padding: "72px 80px",
          fontFamily: SERIF,
        }}
      >
        <div
          style={{
            height: 8,
            width: 96,
            backgroundColor: NEUTRAL_MOOD_PALETTE.accent,
            borderRadius: 4,
          }}
        />
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            textAlign: "center",
            color: NEUTRAL_MOOD_PALETTE.muted,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontStyle: "italic",
              color: NEUTRAL_MOOD_PALETTE.foreground,
              lineHeight: 1.15,
            }}
          >
            A private reflection.
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 22,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            The author kept this one for themselves.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: NEUTRAL_MOOD_PALETTE.muted,
            fontFamily: "system-ui, sans-serif",
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>The Mirror</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", letterSpacing: 0, fontSize: 22 }}>
            Arc
          </span>
        </div>
      </div>
    ),
    { ...SIZE }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createPublicClient();
    const { data: reflection, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("id", id)
      .maybeSingle<Reflection>();

    if (error || !reflection) {
      return new Response("Reflection not found", { status: 404 });
    }

    if (!isReflectionShareable(reflection)) {
      return privateCard();
    }

    const palette = getMoodPalette(resolveMood(reflection));
    const excerpt = makeReflectionExcerpt(reflection.body, 200);
    const dateLabel = formatDate(reflection.created_at);
    const typeLabel = (reflection.reflection_type || "reflection").replace(/_/g, " ");

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
            padding: "72px 80px",
            position: "relative",
          }}
        >
          {/* Top accent bar — subtle left-heavy gradient using mood accent. */}
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

          {/* Meta row: type + date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 40,
              color: palette.muted,
              fontFamily: "system-ui, sans-serif",
              fontSize: 20,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            <span>{typeLabel}</span>
            {dateLabel && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ letterSpacing: 1 }}>{dateLabel}</span>
              </>
            )}
          </div>

          {/* Reflection excerpt — serif italic, generous line height */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              marginTop: 24,
              marginRight: 40,
            }}
          >
            <div
              style={{
                fontSize: excerpt.length > 140 ? 44 : 52,
                fontStyle: "italic",
                lineHeight: 1.28,
                color: palette.foreground,
                letterSpacing: -0.5,
              }}
            >
              {excerpt || reflection.title}
            </div>
          </div>

          {/* Footer: Arc mark + title tagline */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 40,
              color: palette.muted,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "system-ui, sans-serif",
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              <span style={{ color: palette.muted }}>The Mirror</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: palette.accent,
                }}
              />
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 30,
                  color: palette.foreground,
                }}
              >
                Arc
              </span>
            </div>
          </div>
        </div>
      ),
      {
        ...SIZE,
        headers: {
          // Allow CDNs to cache briefly; revalidate so title/content edits propagate.
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[og/reflection] failed:", message);
    return new Response(`Failed to generate share image: ${message}`, {
      status: 500,
    });
  }
}
