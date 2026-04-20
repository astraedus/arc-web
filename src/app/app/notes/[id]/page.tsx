import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditableNoteBody from "@/components/EditableNoteBody";
import DeleteNoteButton from "@/components/DeleteNoteButton";
import ClientDate from "@/components/ClientDate";
import FocusMode from "@/components/FocusMode";
import RawOrganizedToggle from "@/components/RawOrganizedToggle";
import type { EntryTheme, Insight, JournalEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: note, error: noteError } = await supabase
    .from("journal_entries")
    .select(
      "id, user_id, content, note_type, mood_tag, theme_tags, protected, location, weather, metadata, indexed_at, created_at, updated_at"
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
    <article className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/app"
          className="text-sm text-warm-gray hover:text-foreground transition-colors"
        >
          Back to stream
        </Link>
        <FocusMode content={note.content} date={note.created_at} />
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-warm-gray-light">
          <span className="uppercase tracking-wide">{note.note_type}</span>
          <ClientDate iso={note.created_at} format="datetime" />
          {note.updated_at && note.updated_at !== note.created_at ? (
            <span>edited <ClientDate iso={note.updated_at} format="datetime" /></span>
          ) : null}
        </div>
      </header>

      {note.metadata?.raw_transcript &&
      note.metadata.raw_transcript !== note.content ? (
        <RawOrganizedToggle
          organized={note.content}
          raw={note.metadata.raw_transcript}
          organizedByAi={note.metadata.organized_by_ai}
          transcriptionSource={note.metadata.transcription_source ?? null}
        />
      ) : (
        <EditableNoteBody id={note.id} content={note.content} />
      )}

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
                  <ClientDate iso={i.created_at} format="datetime" className="text-xs text-warm-gray-light" />
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

      <div className="border-t border-card-border pt-6">
        <DeleteNoteButton id={note.id} />
      </div>
    </article>
  );
}
