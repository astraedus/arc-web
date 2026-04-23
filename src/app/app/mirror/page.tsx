import { createClient } from "@/lib/supabase/server";
import MirrorClient from "@/components/MirrorClient";
import EarlyAtlasState, { EARLY_ATLAS_THRESHOLD } from "@/components/EarlyAtlasState";
import type { Reflection, Insight } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MirrorPage() {
  const supabase = await createClient();

  // Fetch reflections, insights, and entry-count in parallel. The entry
  // count gates the "early atlas" onboarding state — keeps the Temporal
  // Spine from rendering near-empty for brand-new users.
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
      </header>

      {/* Too-early state: users with few entries still see the Ask Mirror
          UI + any existing reflections on the spine, but we append an
          onboarding nudge underneath urging them to write more before the
          Mirror starts noticing patterns. */}
      {totalEntries < EARLY_ATLAS_THRESHOLD ? (
        <section className="mb-24">
          <MirrorClient
            initialReflections={reflectionList}
            initialInsights={[]}
          />
          <div className="mt-16">
            <EarlyAtlasState
              entryCount={totalEntries}
              title="The Mirror is listening"
              quote="The Mirror notices patterns once you have a few entries to draw from."
              body="A few more honest entries give the Mirror enough texture to catch recurring threads, emotional loops, and the things that keep returning."
              ctaLabel={
                totalEntries === 0
                  ? "Write your first entry"
                  : "Add another entry"
              }
            />
          </div>
        </section>
      ) : (
        <section className="mb-24">
          <MirrorClient
            initialReflections={reflectionList}
            initialInsights={insightList}
          />
        </section>
      )}

      <div className="mt-24 mb-8 text-center">
        <span className="text-warm-gray-light/40 text-xs tracking-[0.3em]">
          • • •
        </span>
      </div>
    </div>
  );
}
