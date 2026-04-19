"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { JournalEntry, Reflection } from "@/lib/types";

type EntryHit = Pick<JournalEntry, "id" | "content" | "created_at" | "mood_tag">;
type ReflectionHit = Pick<Reflection, "id" | "title" | "reflection_type" | "created_at">;

const NAV_ITEMS: Array<{ label: string; href: string; hint: string }> = [
  { label: "Stream", href: "/app", hint: "your latest entries" },
  { label: "Mirror", href: "/app/mirror", hint: "reflections + ask" },
  { label: "Graph", href: "/app/graph", hint: "constellation of your arc" },
  { label: "New note", href: "/app/new", hint: "write something" },
  { label: "Profile", href: "/app/profile", hint: "export, settings" },
];

function snippet(text: string, max = 80) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<EntryHit[]>([]);
  const [reflections, setReflections] = useState<ReflectionHit[]>([]);
  const [loading, setLoading] = useState(false);

  // Toggle on ⌘K / Ctrl+K
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Load recent entries + reflections once when palette opens (and search filters client-side)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const [{ data: entriesData }, { data: reflectionsData }] = await Promise.all([
        supabase
          .from("journal_entries")
          .select("id, content, created_at, mood_tag")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("reflections")
          .select("id, title, reflection_type, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;
      setEntries((entriesData ?? []) as EntryHit[]);
      setReflections((reflectionsData ?? []) as ReflectionHit[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [router, close]
  );

  const ask = useCallback(
    (q: string) => {
      close();
      router.push(`/app/mirror?ask=${encodeURIComponent(q)}`);
    },
    [router, close]
  );

  if (!open) return null;

  const trimmed = query.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-card-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command Menu" shouldFilter={false}>
          <div className="flex items-center gap-3 border-b border-card-border px-5 py-4">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-warm-gray-light"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search entries, jump anywhere, ask the Mirror..."
              className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-warm-gray-light"
              autoFocus
            />
            <kbd className="rounded border border-card-border bg-muted px-2 py-0.5 text-[10px] font-medium text-warm-gray">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {loading && (
              <div className="px-4 py-6 text-center text-xs text-warm-gray-light">
                Loading your arc...
              </div>
            )}

            {!loading && (
              <>
                <Command.Empty className="px-4 py-6 text-center text-sm text-warm-gray">
                  Nothing matches.{" "}
                  {trimmed && (
                    <button
                      type="button"
                      onClick={() => ask(trimmed)}
                      className="text-amber-dark hover:underline"
                    >
                      Ask the Mirror about it →
                    </button>
                  )}
                </Command.Empty>

                {/* Mirror shortcut */}
                {trimmed.length > 3 && (
                  <Command.Group
                    heading="Ask the Mirror"
                    className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-warm-gray-light"
                  >
                    <Command.Item
                      value={`ask-mirror-${trimmed}`}
                      onSelect={() => ask(trimmed)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm aria-selected:bg-amber/10 aria-selected:text-foreground"
                    >
                      <span>
                        Ask:{" "}
                        <span className="text-warm-gray">
                          &ldquo;{trimmed}&rdquo;
                        </span>
                      </span>
                      <span className="text-xs text-warm-gray-light">↩</span>
                    </Command.Item>
                  </Command.Group>
                )}

                {/* Navigation */}
                <Command.Group
                  heading="Go to"
                  className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-warm-gray-light"
                >
                  {NAV_ITEMS.filter(
                    (item) =>
                      !trimmed ||
                      item.label.toLowerCase().includes(trimmed.toLowerCase()) ||
                      item.hint.toLowerCase().includes(trimmed.toLowerCase())
                  ).map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`nav-${item.label}`}
                      onSelect={() => go(item.href)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm aria-selected:bg-amber/10 aria-selected:text-foreground"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-warm-gray-light">
                        {item.hint}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Entries — substring match on content */}
                {(() => {
                  const filtered = !trimmed
                    ? entries.slice(0, 8)
                    : entries
                        .filter((e) =>
                          e.content
                            ?.toLowerCase()
                            .includes(trimmed.toLowerCase())
                        )
                        .slice(0, 12);
                  if (filtered.length === 0) return null;
                  return (
                    <Command.Group
                      heading="Entries"
                      className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-warm-gray-light"
                    >
                      {filtered.map((entry) => (
                        <Command.Item
                          key={entry.id}
                          value={`entry-${entry.id}-${entry.content?.slice(0, 50)}`}
                          onSelect={() => go(`/app/notes/${entry.id}`)}
                          className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-amber/10 aria-selected:text-foreground"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-foreground">
                              {snippet(entry.content || "(empty)")}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-warm-gray-light">
                              <span>{formatDate(entry.created_at)}</span>
                              {entry.mood_tag && (
                                <span className="text-amber-dark">
                                  · {entry.mood_tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })()}

                {/* Reflections */}
                {(() => {
                  const filtered = !trimmed
                    ? reflections.slice(0, 5)
                    : reflections
                        .filter((r) =>
                          r.title
                            ?.toLowerCase()
                            .includes(trimmed.toLowerCase())
                        )
                        .slice(0, 8);
                  if (filtered.length === 0) return null;
                  return (
                    <Command.Group
                      heading="Reflections"
                      className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-warm-gray-light"
                    >
                      {filtered.map((r) => (
                        <Command.Item
                          key={r.id}
                          value={`refl-${r.id}-${r.title}`}
                          onSelect={() => go(`/app/mirror/${r.id}`)}
                          className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-sm aria-selected:bg-amber/10 aria-selected:text-foreground"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-foreground">
                              {r.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-warm-gray-light">
                              <span className="uppercase tracking-wide">
                                {r.reflection_type}
                              </span>
                              <span>· {formatDate(r.created_at)}</span>
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })()}
              </>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-card-border bg-muted/30 px-4 py-2 text-[10px] text-warm-gray-light">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 font-medium">↑↓</kbd>{" "}
                navigate
              </span>
              <span>
                <kbd className="rounded bg-card px-1 py-0.5 font-medium">↩</kbd>{" "}
                open
              </span>
            </div>
            <span>
              <kbd className="rounded bg-card px-1 py-0.5 font-medium">⌘K</kbd> to
              toggle
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
