"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

export default function CreateNoteForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

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
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setSaving(false);
      setError(insertError?.message ?? "Failed to save note.");
      return;
    }

    posthog.capture("note_created", { has_mood: false });

    // Don't reset saving — the redirect will unmount this component.
    // Keeping the button disabled prevents double-submit.
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
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-3">
        <a
          href="/app"
          className="rounded-lg border border-card-border px-4 py-2 text-sm text-warm-gray transition-colors hover:border-amber/30 hover:text-foreground"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={saving || isPending}
          className="rounded-lg bg-amber px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-dark disabled:opacity-60"
        >
          {saving || isPending ? "Saving..." : "Save note"}
        </button>
      </div>
    </form>
  );
}
