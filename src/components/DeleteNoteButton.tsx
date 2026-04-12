"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DeleteNoteButtonProps {
  id: string;
}

export default function DeleteNoteButton({ id }: DeleteNoteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    // Extra safety net: browser-level confirmation
    if (!window.confirm("Delete this note? This can't be undone.")) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setDeleting(false);
        setError(deleteError.message);
        return;
      }

      startTransition(() => {
        router.replace("/app");
        router.refresh();
      });
    } catch (err) {
      setDeleting(false);
      setError(
        err instanceof Error ? err.message : "Failed to delete note. Please try again."
      );
    }
  }

  if (confirming) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600 font-medium">
          Delete this note? This cannot be undone.
        </p>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {deleting || isPending ? "Deleting..." : "Confirm delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting || isPending}
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-warm-gray transition-colors hover:border-amber/30 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
    >
      Delete note
    </button>
  );
}
