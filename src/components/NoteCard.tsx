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
  return (
    <Link
      href={`/app/notes/${note.id}`}
      className="block rounded-2xl border border-card-border bg-card p-6 transition-all hover:border-amber/30 hover:shadow-sm"
    >
      <div className="flex items-center justify-between text-xs text-warm-gray-light">
        <span className="uppercase tracking-wide">{note.note_type}</span>
        <span>{formatDate(note.created_at)}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {preview(note.content || "(empty note)")}
      </p>
      {(note.theme_tags && note.theme_tags.length > 0) || note.mood_tag ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {note.mood_tag ? (
            <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-xs font-medium text-amber-dark">
              {note.mood_tag}
            </span>
          ) : null}
          {note.theme_tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-warm-gray"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
