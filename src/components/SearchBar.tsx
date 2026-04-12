"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import NoteCard from "@/components/NoteCard";
import type { JournalEntry, EchoConnection } from "@/lib/types";

interface SearchableStreamProps {
  initialNotes: JournalEntry[];
  echoMap?: Record<string, EchoConnection[]>;
}

export default function SearchableStream({ initialNotes, echoMap }: SearchableStreamProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JournalEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("journal_entries")
      .select(
        "id, user_id, content, note_type, mood_tag, theme_tags, protected, location, weather, indexed_at, created_at, updated_at"
      )
      .ilike("content", `%${q.trim()}%`)
      .order("created_at", { ascending: false })
      .limit(100);

    setResults((data ?? []) as JournalEntry[]);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  const notes = results !== null ? results : initialNotes;

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your notes..."
          className="w-full rounded-2xl border border-card-border bg-card px-5 py-3 text-sm text-foreground placeholder:text-warm-gray-light transition-colors focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2"
        />
        {searching ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-warm-gray-light">
            Searching...
          </span>
        ) : null}
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-card p-8 text-center">
          <p className="text-sm text-warm-gray">
            {query.trim() ? "No notes match your search." : "No notes yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              echoes={echoMap?.[note.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
