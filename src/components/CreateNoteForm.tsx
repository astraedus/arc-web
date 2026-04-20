"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import VoiceRecorder from "@/components/VoiceRecorder";
import { organizeTranscript } from "@/lib/organize";

const MOODS: Array<{ key: string; label: string; color: string }> = [
  { key: "struggling", label: "struggling", color: "#5A748F" },
  { key: "uncertain", label: "uncertain", color: "#7C8E6B" },
  { key: "steady", label: "steady", color: "#A88B5C" },
  { key: "hopeful", label: "hopeful", color: "#E8A849" },
  { key: "alive", label: "alive", color: "#D97706" },
];

type TranscriptionSource = "manual" | "gemini_flash";



export default function CreateNoteForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [organizing, setOrganizing] = useState(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);
  // Raw transcript captured from voice — preserved through organize so user
  // can always recover what they actually said.
  const [rawTranscript, setRawTranscript] = useState<string | null>(null);
  const [organizedByAi, setOrganizedByAi] = useState(false);
  const [transcriptionSource, setTranscriptionSource] =
    useState<TranscriptionSource | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ⌘+Enter to save, scoped to this form (not the global signout form).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleVoiceTranscript(transcript: string) {
    setError(null);
    setOrganizeError(null);
    setTranscriptionSource("gemini_flash");
    setOrganizedByAi(false);
    setContent((prev) => {
      const merged = prev.trim().length > 0 ? `${prev.trim()} ${transcript}` : transcript;
      // Snapshot the raw whenever new voice input arrives. If the user later
      // organizes, this snapshot is what they can revert/compare to.
      setRawTranscript(merged);
      return merged;
    });
    // Move focus back to textarea so they can keep editing or save.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function handleOrganize() {
    if (organizing) return;
    if (!content.trim() || content.trim().length < 50) {
      setOrganizeError("Need a bit more text before the AI can organize it.");
      return;
    }
    setOrganizeError(null);
    setOrganizing(true);

    // Snapshot whatever's in the textarea right now as the raw — covers the
    // case where user edits transcribed text before hitting Organize.
    const snapshotRaw = content;

    const result = await organizeTranscript(content);
    if (!result || !result.organized) {
      setOrganizeError(
        "The Mirror couldn't organize this right now. Try again in a moment."
      );
      setOrganizing(false);
      return;
    }
    setRawTranscript(snapshotRaw);
    setContent(result.organized);
    setOrganizedByAi(true);
    setOrganizing(false);
  }

  function handleRevertOrganize() {
    if (!rawTranscript) return;
    setContent(rawTranscript);
    setOrganizedByAi(false);
  }

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

    const metadata: Record<string, unknown> = {};
    if (rawTranscript && rawTranscript !== content) {
      metadata.raw_transcript = rawTranscript;
    }
    if (organizedByAi) {
      metadata.organized_by_ai = true;
    }
    if (transcriptionSource) {
      metadata.transcription_source = transcriptionSource;
    }
    if (Object.keys(metadata).length > 0) {
      metadata.captured_at = new Date().toISOString();
    }

    const { data, error: insertError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        content: content.trim(),
        note_type: transcriptionSource === "gemini_flash" ? "voice" : "text",
        // Note: source-string check above intentional; if more sources are added later, update both spots.
        mood_tag: mood,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setSaving(false);
      setError(insertError?.message ?? "Failed to save note.");
      return;
    }

    posthog.capture("note_created", {
      has_mood: !!mood,
      transcription_source: transcriptionSource ?? "manual",
      organized_by_ai: organizedByAi,
    });

    startTransition(() => {
      router.replace(`/app/notes/${data.id}`);
      router.refresh();
    });
  }

  const showRevert = organizedByAi && rawTranscript && rawTranscript !== content;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          // Manual edit after organize means it's no longer "the AI's version"
          if (organizedByAi) setOrganizedByAi(false);
        }}
        placeholder="however it lands. nothing has to be polished."
        rows={14}
        autoFocus
        className="w-full rounded-2xl border border-card-border bg-card p-6 text-base leading-relaxed text-foreground placeholder:italic placeholder:text-warm-gray-light"
      />

      {/* Voice + Organize row */}
      <div className="flex flex-wrap items-center gap-4">
        <VoiceRecorder
          onTranscript={handleVoiceTranscript}
          disabled={saving || organizing}
        />

        <div className="ml-auto flex items-center gap-3">
          {showRevert && (
            <button
              type="button"
              onClick={handleRevertOrganize}
              className="text-xs italic text-warm-gray underline hover:text-foreground"
              title="Restore what you originally wrote/said"
            >
              revert to raw
            </button>
          )}
          <button
            type="button"
            onClick={handleOrganize}
            disabled={organizing || saving || content.trim().length < 50}
            className="rounded-full border border-amber/40 px-3.5 py-1.5 text-xs text-amber-dark transition-colors hover:bg-amber/5 disabled:cursor-not-allowed disabled:opacity-50"
            title="Let the Mirror clean up filler and structure"
          >
            {organizing ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-dark" />
                organizing...
              </span>
            ) : organizedByAi ? (
              "✦ organized"
            ) : (
              "✦ organize"
            )}
          </button>
        </div>
      </div>

      {organizeError && (
        <p className="text-xs text-red-600" role="alert">
          {organizeError}
        </p>
      )}

      {/* Mood selector */}
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
