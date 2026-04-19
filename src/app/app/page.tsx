import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchableStream from "@/components/SearchBar";
import OnThisDay from "@/components/OnThisDay";
import RiverOfTime from "@/components/RiverOfTime";
import type { JournalEntry, EchoConnection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StreamPage() {
  const supabase = await createClient();
  const [notesRes, reflectionsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select(
        "id, user_id, content, note_type, mood_tag, theme_tags, protected, location, weather, indexed_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("reflections")
      .select("id, title, reflection_type, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const { data: notes, error } = notesRes;
  const reflections = reflectionsRes.data ?? [];

  const list = (notes ?? []) as JournalEntry[];

  // Fetch echo connections for all displayed notes.
  const noteIds = list.map((n) => n.id);
  let echoMap: Record<string, EchoConnection[]> = {};
  if (noteIds.length > 0) {
    const { data: echoes } = await supabase
      .from("echo_connections")
      .select("*")
      .or(
        `source_entry_id.in.(${noteIds.join(",")}),echo_entry_id.in.(${noteIds.join(",")})`
      );
    if (echoes) {
      for (const echo of echoes as EchoConnection[]) {
        // Map echoes to both source and echo entry
        if (noteIds.includes(echo.source_entry_id)) {
          if (!echoMap[echo.source_entry_id]) echoMap[echo.source_entry_id] = [];
          echoMap[echo.source_entry_id].push(echo);
        }
        if (noteIds.includes(echo.echo_entry_id)) {
          if (!echoMap[echo.echo_entry_id]) echoMap[echo.echo_entry_id] = [];
          echoMap[echo.echo_entry_id].push(echo);
        }
      }
    }
  }

  const riverEntries = list
    .map((e) => ({
      id: e.id,
      content: e.content,
      created_at: e.created_at,
      mood_tag: e.mood_tag,
    }))
    .reverse(); // oldest first for the river

  return (
    <div className="mx-auto max-w-4xl">
      {/* Quiet header — minimal, no shouty CTA */}
      <header className="pt-4 pb-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
          Your arc
        </p>
        <p className="mt-3 text-sm italic text-warm-gray">
          {list.length === 0
            ? "Where you are right now."
            : list.length === 1
              ? "One stone placed. The arc has begun."
              : `${list.length} ${list.length === 1 ? "entry" : "entries"} so far.`}
        </p>
      </header>

      {/* On This Day -- the most emotional surface comes first */}
      <section className="mb-24">
        <OnThisDay />
      </section>

      {/* The river -- own breathing room */}
      {list.length > 1 && (
        <section className="mb-24 space-y-4">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
              The river
            </p>
            <p className="mt-2 text-xs italic text-warm-gray">
              earlier on the left, now on the right
            </p>
          </div>
          <RiverOfTime entries={riverEntries} reflections={reflections} />
        </section>
      )}

      {/* Stream -- the actual entries */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-t border-card-border pt-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-warm-gray-light">
              The stream
            </p>
            <p className="mt-2 text-xs italic text-warm-gray">
              every entry, newest first
            </p>
          </div>
          <Link
            href="/app/new"
            className="rounded-full border border-card-border bg-card px-4 py-1.5 text-xs text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground"
          >
            <span className="mr-1.5">✎</span>write
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Failed to load notes: {error.message}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-card-border bg-card p-16 text-center">
            <p className="text-base italic text-warm-gray">
              Where are you right now?
            </p>
            <p className="mx-auto mt-3 max-w-sm text-xs text-warm-gray-light">
              Not your location. Your life. Write your first honest entry.
              The Mirror, the river, the constellation all begin with this.
            </p>
            <Link
              href="/app/new"
              className="mt-8 inline-block rounded-lg bg-amber px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark"
            >
              Begin your arc
            </Link>
          </div>
        ) : (
          <SearchableStream initialNotes={list} echoMap={echoMap} />
        )}
      </section>

      {/* Quiet bottom marker */}
      <div className="mt-24 mb-8 text-center">
        <span className="text-warm-gray-light/40 text-xs tracking-[0.3em]">
          • • •
        </span>
      </div>
    </div>
  );
}
