import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchableStream from "@/components/SearchBar";
import type { JournalEntry, EchoConnection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StreamPage() {
  const supabase = await createClient();
  const { data: notes, error } = await supabase
    .from("journal_entries")
    .select(
      "id, user_id, content, note_type, mood_tag, theme_tags, protected, location, weather, indexed_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your stream</h1>
          <p className="mt-1 text-sm text-warm-gray">
            Every note, newest first.
          </p>
        </div>
        <Link
          href="/app/new"
          className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-dark"
        >
          New note
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Failed to load notes: {error.message}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-card p-12 text-center">
          <h2 className="text-lg font-semibold">No notes yet</h2>
          <p className="mt-2 text-sm text-warm-gray">
            Write your first note from the web, or pull it up on the phone.
          </p>
          <Link
            href="/app/new"
            className="mt-6 inline-block rounded-lg bg-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-dark"
          >
            Write a note
          </Link>
        </div>
      ) : (
        <SearchableStream initialNotes={list} echoMap={echoMap} />
      )}
    </div>
  );
}
