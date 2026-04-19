"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

const MOODS: Array<{ key: string; label: string; color: string }> = [
  { key: "struggling", label: "struggling", color: "#7B92A8" },
  { key: "uncertain", label: "uncertain", color: "#A8B89A" },
  { key: "steady", label: "steady", color: "#E8DDC3" },
  { key: "hopeful", label: "hopeful", color: "#FFC785" },
  { key: "alive", label: "alive", color: "#F5A623" },
];

export default function CreateNoteForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  // ⌘+Enter to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const form = document.querySelector("form");
        if (form) (form as HTMLFormElement).requestSubmit();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Write something before saving.");
      return;
    }
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("You were signed out. Refresh and try again.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        content: content.trim(),
        note_type: "text",
        mood_tag: mood,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setSaving(false);
      setError(insertError?.message ?? "Failed to save note.");
      return;
    }

    posthog.capture("note_created", { has_mood: !!mood });

    startTransition(() => {
      router.replace(`/app/notes/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Dump it here. Anything. Arc will organize it later."
        rows={14}
        autoFocus
        className="w-full rounded-2xl border border-card-border bg-card p-6 text-base leading-relaxed text-foreground placeholder:text-warm-gray-light"
      />

      {/* Optional mood */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-warm-gray-light">
          mood
        </span>
        {MOODS.map((m) => (
          <button
            type="button"
            key={m.key}
            onClick={() => setMood(mood === m.key ? null : m.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
              mood === m.key
                ? "border-amber/60 bg-amber/10 text-foreground shadow-sm"
                : "border-card-border bg-card text-warm-gray hover:border-warm-gray-light/40"
            }`}
            aria-pressed={mood === m.key}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: m.color }}
            />
            {m.label}
          </button>
        ))}
        {mood && (
          <button
            type="button"
            onClick={() => setMood(null)}
            className="ml-auto text-xs text-warm-gray-light underline hover:text-warm-gray"
          >
            clear
          </button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs italic text-warm-gray-light">
          <kbd className="rounded border border-card-border bg-card px-1 font-medium">
            ⌘
          </kbd>
          <kbd className="ml-0.5 rounded border border-card-border bg-card px-1 font-medium">
            ↩
          </kbd>{" "}
          to save
        </span>
        <div className="flex items-center gap-3">
          <a
            href="/app"
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-warm-gray transition-colors hover:border-amber/30 hover:text-foreground"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={saving || isPending}
            className="rounded-lg bg-amber px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark disabled:opacity-60"
          >
            {saving || isPending ? "Saving..." : "Save note"}
          </button>
        </div>
      </div>
    </form>
  );
}
