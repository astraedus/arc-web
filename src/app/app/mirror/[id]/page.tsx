import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReflectionBody from "@/components/ReflectionBody";
import type { Reflection } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReflectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reflection, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("id", id)
    .maybeSingle<Reflection>();

  if (error || !reflection) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <div>
        <Link
          href="/app/mirror"
          className="text-sm text-warm-gray hover:text-foreground transition-colors"
        >
          Back to Mirror
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-gray-light">
          <span className="uppercase tracking-wide">
            {reflection.reflection_type}
          </span>
          <span>{formatDate(reflection.created_at)}</span>
          {reflection.entry_count_at_generation != null && (
            <span>
              Based on {reflection.entry_count_at_generation} entries
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          {reflection.title}
        </h1>
      </header>

      <div className="rounded-2xl border border-card-border bg-card p-8">
        <ReflectionBody body={reflection.body} />
      </div>

      {reflection.period_start && reflection.period_end && (
        <div className="text-xs text-warm-gray-light">
          Period: {formatDate(reflection.period_start)} &ndash;{" "}
          {formatDate(reflection.period_end)}
        </div>
      )}
    </article>
  );
}
