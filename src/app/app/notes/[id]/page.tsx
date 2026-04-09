import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EntryTheme, Insight, JournalEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: note, error: noteError } = await supabase
    .from("journal_entries")
    .select(
      "id, user_id, content, note_type, mood_tag, theme_tags, protected, location, weather, indexed_at, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle<JournalEntry>();

  if (noteError || !note) {
    notFound();
  }

  // Fetch linked themes (mind map nodes the AI attached to this note).
  const { data: themes } = await supabase
    .from("entry_themes")
    .select("id, entry_id, node_id, insight, life_map_nodes(id, label, level)")
    .eq("entry_id", note.id);

  const themeList = (themes ?? []) as unknown as EntryTheme[];

  // Fetch insights that reference this note id in their related_note_ids.
  const { data: insights } = await supabase
    .from("insights")
    .select("id, user_id, insight_type, title, description, related_note_ids, created_at")
    .contains("related_note_ids", [note.id]);

  const insightList = (insights ?? []) as Insight[];

  return (
    <article className="space-y-8">
      <div>
        <Link
          href="/app"
          className="text-sm text-warm-gray hover:text-foreground transition-colors"
        >
          Back to stream
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-gray-light">
          <span className="uppercase tracking-wide">{note.note_type}</span>
          <span>{formatDateTime(note.created_at)}</span>
          {note.updated_at && note.updated_at !== note.created_at ? (
            <span>edited {formatDateTime(note.updated_at)}</span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          {note.content.split("\n")[0].slice(0, 120) || "Untitled note"}
        </h1>
      </header>

      <div className="rounded-2xl border border-card-border bg-card p-8">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {note.content}
        </p>
      </div>

      {(note.mood_tag || (note.theme_tags && note.theme_tags.length > 0)) ? (
        <div className="flex flex-wrap items-center gap-2">
          {note.mood_tag ? (
            <span className="rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber-dark">
              mood: {note.mood_tag}
            </span>
          ) : null}
          {note.theme_tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-3 py-1 text-xs text-warm-gray"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {(note.location || note.weather) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {note.location ? (
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-warm-gray-light">
                Location
              </div>
              <div className="mt-1 text-sm text-foreground">{note.location}</div>
            </div>
          ) : null}
          {note.weather ? (
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-warm-gray-light">
                Weather
              </div>
              <div className="mt-1 text-sm text-foreground">{note.weather}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {themeList.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
            Mind map connections
          </h2>
          <div className="flex flex-wrap gap-2">
            {themeList.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-card-border bg-card px-3 py-1 text-xs text-foreground"
              >
                {t.life_map_nodes?.label ?? "Unnamed node"}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {insightList.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
            Insights
          </h2>
          <div className="space-y-3">
            {insightList.map((i) => (
              <div
                key={i.id}
                className="rounded-xl border border-card-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-amber-dark">
                    {i.insight_type}
                  </span>
                  <span className="text-xs text-warm-gray-light">
                    {formatDateTime(i.created_at)}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-foreground">
                  {i.title}
                </h3>
                {i.description ? (
                  <p className="mt-1 text-sm text-warm-gray">{i.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
