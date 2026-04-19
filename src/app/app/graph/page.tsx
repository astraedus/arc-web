import { createClient } from "@/lib/supabase/server";
import Constellation from "@/components/Constellation";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const supabase = await createClient();

  const [entriesRes, echoesRes, reflectionsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, content, created_at, mood_tag, theme_tags")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("echo_connections")
      .select("source_entry_id, echo_entry_id"),
    supabase
      .from("reflections")
      .select("id, title, reflection_type, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const entries = entriesRes.data ?? [];
  const echoes = echoesRes.data ?? [];
  const reflections = reflectionsRes.data ?? [];

  return (
    <div className="space-y-8">
      <header className="pt-4 pb-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
          The constellation
        </p>
        <p
          className="mt-3 text-lg italic text-warm-gray"
          style={{
            fontFamily:
              "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
          }}
        >
          Hover to peek. Click to read. Echoes connect across time.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-card-border bg-card p-12 text-center">
          <p className="text-base italic text-warm-gray">
            Nothing to map yet.
          </p>
          <p className="mt-3 text-xs text-warm-gray-light">
            The constellation grows from your entries. Write your first one
            and return.
          </p>
        </div>
      ) : (
        <Constellation
          entries={entries}
          echoes={echoes}
          reflections={reflections}
        />
      )}
    </div>
  );
}
