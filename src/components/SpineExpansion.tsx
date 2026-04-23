"use client";

/**
 * SpineExpansion — the inline drill-down panel that appears when a
 * reflection, insight, or entry card on the TemporalSpine is clicked.
 *
 * Semantics differ slightly by kind:
 *
 *   – Reflection / Insight expansion: renders the list of source entries
 *     that fed into the reflection/insight. Each source entry is editable
 *     in place (when `inert=false`) via the existing `EditableNoteBody`.
 *
 *   – Entry expansion: renders the full body of a single entry, with an
 *     edit affordance so users can correct their own thought right on the
 *     spine — matching Anti's "Obsidian that's self-reorganising and
 *     living" vision.
 *
 * Design constraints:
 *   – Nested visual indent (16px, soft warm-gray left border) so the
 *     expansion reads as "inside" the parent card, not floating beside it.
 *   – Demo mode (`inert=true`) swaps EditableNoteBody for a read-only
 *     renderer — `/app/notes/:id` is auth-gated, and the demo must not
 *     hit Supabase mutations.
 *   – Accessible: panel is hidden via `hidden` attribute + aria-hidden;
 *     the trigger card carries aria-expanded on the parent.
 */

import Link from "next/link";
import ClientDate from "@/components/ClientDate";
import EditableNoteBody from "@/components/EditableNoteBody";
import { moodColor } from "@/lib/mood-palette";
import type { JournalEntry } from "@/lib/types";

interface SpineExpansionProps {
  /** Entries to render — empty array is handled inline with an empty-state. */
  entries: JournalEntry[];
  /** When true, no edit affordance + no link to /app/notes/:id. */
  inert: boolean;
  /**
   * Descriptive caption shown above the entries list. Lets callers tailor
   * the header per kind ("Entries this reflection drew from" vs
   * "Entries this insight notices").
   */
  caption?: string;
}

/**
 * Derive a display title for an entry that has no explicit title field.
 * The schema stores the whole entry as `content`; we take the first
 * non-empty line (up to ~70 chars) as the title, stripping trailing
 * punctuation so it reads like a header, not a snippet.
 */
export function deriveEntryTitle(content: string): string {
  const firstLine = content.split("\n").map((l) => l.trim()).find(Boolean) ?? "Untitled";
  const trimmed = firstLine.length > 70 ? `${firstLine.slice(0, 67)}...` : firstLine;
  // If the first line was a whole paragraph that included punctuation,
  // drop a trailing period so it reads like a title.
  return trimmed.replace(/[.!?]+$/, "");
}

/**
 * Derive an excerpt — everything AFTER the first line, trimmed and
 * collapsed to ~180 chars. If there is no second line, we return an
 * empty string and the caller omits the excerpt.
 */
export function deriveEntryExcerpt(content: string): string {
  const firstBreak = content.indexOf("\n");
  if (firstBreak === -1) return "";
  const rest = content.slice(firstBreak + 1).trim();
  if (rest.length <= 180) return rest;
  return `${rest.slice(0, 177)}...`;
}

export default function SpineExpansion({
  entries,
  inert,
  caption,
}: SpineExpansionProps) {
  if (entries.length === 0) {
    return (
      <div className="mt-4 ml-4 border-l-2 border-card-border/60 pl-4">
        <p className="text-[12px] italic text-warm-gray-light">
          No source entries found for this one. The Mirror may have drawn on
          general patterns rather than specific entries.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 ml-4 border-l-2 border-card-border/60 pl-4">
      {caption ? (
        <p className="mb-3 text-[10px] uppercase tracking-[0.14em] text-warm-gray-light">
          {caption}
        </p>
      ) : null}

      <ul className="space-y-4">
        {entries.map((entry) => (
          <li key={entry.id}>
            <SourceEntryCard entry={entry} inert={inert} />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SourceEntryCardProps {
  entry: JournalEntry;
  inert: boolean;
}

function SourceEntryCard({ entry, inert }: SourceEntryCardProps) {
  const color = moodColor(entry.mood_tag);
  const title = deriveEntryTitle(entry.content);

  return (
    <article
      className="rounded-xl border border-card-border/70 bg-card/70 p-4 transition-colors duration-300 hover:border-amber/30"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      {/* Header row — mood / date / protected / type */}
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-warm-gray-light">
        <div className="flex items-center gap-2">
          {entry.mood_tag ? (
            <span style={{ color }}>{entry.mood_tag}</span>
          ) : (
            <span>{entry.note_type}</span>
          )}
          {entry.protected ? (
            <span
              aria-label="Protected entry"
              title="Protected"
              className="rounded-full bg-amber/10 px-1.5 py-[1px] text-[9px] text-amber-dark"
            >
              protected
            </span>
          ) : null}
        </div>
        <ClientDate iso={entry.created_at} format="date" />
      </div>

      {/* Title — serif italic, matches reflection typography */}
      <h4
        className="mt-2 text-[15px] italic leading-snug text-foreground"
        style={{
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
        }}
      >
        {title}
      </h4>

      {/* Body */}
      <div className="mt-3">
        {inert ? (
          // Demo mode — read-only, no Supabase mutation
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-warm-gray">
            {entry.content}
          </p>
        ) : (
          <EditableNoteBody id={entry.id} content={entry.content} />
        )}
      </div>

      {/* Theme chips + open-full link */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.theme_tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-[2px] text-[10px] text-warm-gray"
            >
              {tag}
            </span>
          ))}
        </div>
        {inert ? null : (
          <Link
            href={`/app/notes/${entry.id}`}
            className="text-[11px] italic text-warm-gray underline-offset-2 hover:text-amber-dark hover:underline"
          >
            open full note →
          </Link>
        )}
      </div>
    </article>
  );
}
