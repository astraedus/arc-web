import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { isReflectionShareable } from "@/lib/reflection-visibility";
import { makeReflectionExcerpt } from "@/lib/reflection-excerpt";
import { getMoodSharePalette } from "@/lib/mood-palette";
import ReflectionBody from "@/components/ReflectionBody";
import ClientDate from "@/components/ClientDate";
import type { Reflection } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function resolveMood(reflection: Reflection): string | null {
  const metaMood =
    reflection.metadata && typeof reflection.metadata === "object"
      ? (reflection.metadata as Record<string, unknown>).mood
      : undefined;
  return typeof metaMood === "string" && metaMood.length > 0 ? metaMood : null;
}

function resolveBaseUrl(): string {
  // Vercel provides VERCEL_URL; for local dev we fall back to localhost.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

async function fetchShareableReflection(id: string): Promise<Reflection | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .eq("id", id)
      .maybeSingle<Reflection>();

    if (error || !data) return null;
    if (!isReflectionShareable(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const reflection = await fetchShareableReflection(id);

  const baseUrl = resolveBaseUrl();
  const ogImage = `${baseUrl}/api/og/reflection/${encodeURIComponent(id)}`;
  const pageUrl = `${baseUrl}/r/${encodeURIComponent(id)}`;

  if (!reflection) {
    return {
      title: "Reflection not found · Arc",
      description: "This reflection is private or no longer shared.",
      robots: { index: false, follow: false },
    };
  }

  const title = reflection.title || "A reflection · Arc";
  const description = makeReflectionExcerpt(reflection.body, 180);

  return {
    title: `${title} · Arc`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: pageUrl,
      siteName: "Arc",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function PublicReflectionPage({ params }: PageProps) {
  const { id } = await params;
  const reflection = await fetchShareableReflection(id);

  if (!reflection) {
    notFound();
  }

  const palette = getMoodSharePalette(resolveMood(reflection));

  return (
    <main className="min-h-screen w-full px-6 py-14 sm:py-20">
      <div
        aria-hidden
        className="mx-auto h-1 w-24 rounded-full"
        style={{ backgroundColor: palette.accent, opacity: 0.85 }}
      />

      <article className="mx-auto mt-10 max-w-2xl space-y-10">
        <header className="space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
            <span>{reflection.reflection_type}</span>
            <span aria-hidden>·</span>
            <ClientDate iso={reflection.created_at} format="datetime" />
          </div>
          <h1
            className="text-3xl sm:text-4xl leading-tight tracking-tight text-foreground"
            style={{
              fontFamily:
                "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
              fontStyle: "italic",
            }}
          >
            {reflection.title}
          </h1>
        </header>

        <div
          className="rounded-2xl border p-8 sm:p-10"
          style={{
            borderColor: "var(--color-card-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <ReflectionBody body={reflection.body} />
        </div>

        {reflection.period_start && reflection.period_end && (
          <div className="text-center text-xs text-warm-gray-light">
            Period:{" "}
            <ClientDate iso={reflection.period_start} format="datetime" /> &ndash;{" "}
            <ClientDate iso={reflection.period_end} format="datetime" />
          </div>
        )}

        <footer className="mt-16 flex flex-col items-center gap-3 pt-10 border-t border-card-border text-center">
          <p
            className="text-base text-warm-gray"
            style={{
              fontFamily:
                "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Want your own Mirror?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: palette.accent,
              color: palette.accent,
            }}
          >
            Try Arc
            <span aria-hidden>→</span>
          </Link>
        </footer>
      </article>
    </main>
  );
}
