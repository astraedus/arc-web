import Link from "next/link";
import ClientDate from "@/components/ClientDate";
import type { JournalEntry, EchoConnection } from "@/lib/types";

interface NoteCardProps {
  note: JournalEntry;
  echoes?: EchoConnection[];
}

function preview(text: string, max = 240) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

export default function NoteCard({ note, echoes }: NoteCardProps) {
  const showBadgeRow =
    note.mood_tag ||
    note.note_type !== "text" ||
    (note.theme_tags && note.theme_tags.length > 0);

  return (
    <Link
      href={`/app/notes/${note.id}`}
      className="block rounded-2xl border border-card-border bg-card p-6 transition-all hover:border-amber/30 hover:shadow-sm hover:bg-amber/[0.02] cursor-pointer"
    >
      <div className="flex items-center justify-between text-xs text-warm-gray-light">
        <ClientDate iso={note.created_at} format="date" />
        {note.location ? (
          <span>{note.location}</span>
        ) : null}
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

      {echoes && echoes.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-dark">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>
            Echoes a note from{" "}
            <ClientDate iso={echoes[0].created_at} format="short" />
          </span>
        </div>
      )}
    </Link>
  );
}
