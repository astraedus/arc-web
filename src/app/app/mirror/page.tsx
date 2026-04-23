import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MirrorClient from "@/components/MirrorClient";
import type { Reflection, Insight } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MirrorPage() {
  const supabase = await createClient();

  // Fetch reflections, insights, and entry-count in parallel. Unlike the
  // previous `EARLY_ATLAS_THRESHOLD`-based fallback, we no longer GATE the
  // Mirror on entry count — the spine renders at every count. Entry-count
  // is still fetched because TemporalSpine uses it to decide which ghost
  // placeholder cards to render (e.g. "next weekly reflection in ~N
  // entries"). The feature never hides; it just fills in over time.
  const [
    { data: reflections },
    { data: insightRows },
    { count: entryCount },
  ] = await Promise.all([
    supabase
      .from("reflections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("insights")
      .select(
        "id, user_id, insight_type, title, description, related_note_ids, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }),
  ]);

  const reflectionList = (reflections ?? []) as Reflection[];
  const insightList = (insightRows ?? []) as Insight[];
  const totalEntries = entryCount ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="pt-4 pb-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
          The Mirror
        </p>
        <p
          className="mt-4 text-2xl italic text-foreground"
          style={{
            fontFamily:
              "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
          }}
        >
          Your journal, reflected back to you.
        </p>

        {totalEntries === 0 && (
          <div className="mt-8">
            <Link
              href="/app/new"
              className="inline-flex items-center rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
            >
              Write your first entry →
            </Link>
          </div>
        )}
      </header>

      <section className="mb-24">
        <MirrorClient
          initialReflections={reflectionList}
          initialInsights={insightList}
          entryCount={totalEntries}
        />
      </section>

      <div className="mt-24 mb-8 text-center">
        <span className="text-warm-gray-light/40 text-xs tracking-[0.3em]">
          • • •
        </span>
      </div>
    </div>
  );
}
