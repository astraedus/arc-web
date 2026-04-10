import Link from "next/link";
import type { JournalEntry } from "@/lib/types";

interface NoteCardProps {
  note: JournalEntry;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function preview(text: string, max = 240) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

export default function NoteCard({ note }: NoteCardProps) {
  const showBadgeRow =
    note.mood_tag ||
    note.note_type !== "text" ||
    note.location ||
    (note.theme_tags && note.theme_tags.length > 0);

  return (
    <Link
      href={`/app/notes/${note.id}`}
      className="block rounded-2xl border border-card-border bg-card p-6 transition-all hover:border-amber/30 hover:shadow-sm"
    >
      <div className="flex items-center justify-between text-xs text-warm-gray-light">
        <span className="uppercase tracking-wide">{note.note_type}</span>
        <div className="flex items-center gap-2">
          {note.location ? (
            <span>{note.location}</span>
          ) : null}
          <span>{formatDate(note.created_at)}</span>
        </div>
      </div>

      {showBadgeRow ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {note.mood_tag ? (
            <span className="rounded-full bg-amber/10 px-2 py-0.5 text-xs text-amber-dark">
              {note.mood_tag}
            </span>
          ) : null}
          {note.note_type !== "text" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-warm-gray">
              {note.note_type}
            </span>
          ) : null}
          {note.theme_tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-warm-gray"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {preview(note.content || "(empty note)")}
      </p>
    </Link>
  );
}
