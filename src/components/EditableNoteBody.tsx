"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface EditableNoteBodyProps {
  id: string;
  content: string;
}

export default function EditableNoteBody({ id, content }: EditableNoteBodyProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setDraft(content);
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(content);
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    if (!draft.trim()) {
      setError("Note cannot be empty.");
      return;
    }
    setError(null);
    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({ content: draft.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    setSaving(false);
    setEditing(false);
    startTransition(() => {
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
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
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving || isPending}
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-warm-gray transition-colors hover:border-amber/30 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isPending}
            className="rounded-lg bg-amber px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-dark disabled:opacity-60"
          >
            {saving || isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-card-border bg-card p-8">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {content.includes("\n")
            ? content.slice(content.indexOf("\n") + 1)
            : content}
        </p>
      </div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleEdit}
          className="rounded-lg border border-card-border px-4 py-2 text-sm text-warm-gray transition-colors hover:border-amber/30 hover:text-foreground"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
