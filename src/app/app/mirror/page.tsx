import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MirrorClient from "@/components/MirrorClient";
import type { Reflection, Insight, JournalEntry } from "@/lib/types";
import { buildWikilinkTargetMap } from "@/lib/wikilinks";

export const dynamic = "force-dynamic";

export default async function MirrorPage() {
  const supabase = await createClient();

  // Fetch reflections, insights, entries, and entry-count in parallel.
  // Entries are fetched so the "entries" layer + spine drill-downs have
  // real data client-side without a second round-trip. Capped at 100 to
  // keep payload bounded; the spine already caps reflections at 50.
  const [
    { data: reflections },
    { data: insightRows },
    { data: entryRows },
    { count: entryCount },
    { data: wikilinkNotes },
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
    supabase
      .from("journal_entries")
      .select(
        "id, user_id, content, note_type, mood_tag, theme_tags, protected, location, weather, metadata, indexed_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }),
    supabase
      .from("journal_entries")
      .select("id, content, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000),
  ]);

  const reflectionList = (reflections ?? []) as Reflection[];
  const insightList = (insightRows ?? []) as Insight[];
  const entryList = (entryRows ?? []) as JournalEntry[];
  const totalEntries = entryCount ?? 0;
  const wikilinkTargets = buildWikilinkTargetMap(wikilinkNotes ?? []);

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
          initialEntries={entryList}
          wikilinkTargets={wikilinkTargets}
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
