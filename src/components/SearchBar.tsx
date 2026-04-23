"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import NoteCard from "@/components/NoteCard";
import type { JournalEntry, EchoConnection } from "@/lib/types";
import type { WikilinkTargetMap } from "@/lib/wikilinks";

interface SearchableStreamProps {
  initialNotes: JournalEntry[];
  echoMap?: Record<string, EchoConnection[]>;
  wikilinkTargets?: WikilinkTargetMap;
}

export default function SearchableStream({
  initialNotes,
  echoMap,
  wikilinkTargets,
}: SearchableStreamProps) {
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
    <div className="space-y-6">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray-light/60">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Look back through it all..."
          className="w-full rounded-full border border-card-border bg-transparent py-3 pl-11 pr-12 text-sm text-foreground placeholder:italic placeholder:text-warm-gray-light/70 transition-all focus-visible:bg-card focus-visible:border-amber/40 focus-visible:outline-none"
        />
        {searching ? (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] italic text-warm-gray-light">
            looking...
          </span>
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-warm-gray-light hover:text-warm-gray"
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-card p-10 text-center">
          <p className="text-sm italic text-warm-gray">
            {query.trim() ? "Nothing here on that thread." : "No notes yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              echoes={echoMap?.[note.id]}
              wikilinkTargets={wikilinkTargets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
