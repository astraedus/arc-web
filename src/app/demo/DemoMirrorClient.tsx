"use client";

/**
 * Demo-mode fork of MirrorClient. Renders the same reflections list + Ask UI,
 * but any Ask / Generate action shows a signup nudge instead of calling
 * Supabase. The goal: show the UX, not expose a free call-to-LLM endpoint.
 */
import { useState } from "react";
import type { Reflection } from "@/lib/types";

interface DemoMirrorClientProps {
  initialReflections: Reflection[];
}

function previewBody(text: string, lines = 6) {
  const split = text.split("\n");
  if (split.length <= lines) return text;
  return `${split.slice(0, lines).join("\n").trim()}\n\n...`;
}

function shortDate(iso: string) {
  // Compute on the client via the usual Date API. This component is "use client"
  // so no hydration mismatch path.
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DemoMirrorClient({
  initialReflections,
}: DemoMirrorClientProps) {
  const reflections = initialReflections;
  const [question, setQuestion] = useState("");
  const [nudge, setNudge] = useState<string | null>(null);

  function handleAsk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim()) return;
    setNudge(
      "This is a demo — ask the Mirror your own questions by signing up."
    );
  }

  function handleGenerateWeekly() {
    setNudge(
      "Weekly reflections are generated from your own entries. Sign up to start yours."
    );
  }

  return (
    <div className="space-y-10">
      {/* Ask the Mirror */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
          Ask the Mirror
        </h2>
        <form onSubmit={handleAsk} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your journey..."
            className="flex-1 rounded-2xl border border-card-border bg-card px-5 py-3 text-sm text-foreground placeholder:text-warm-gray-light transition-colors focus-visible:outline-2 focus-visible:outline-amber focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className="rounded-lg bg-amber px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark disabled:opacity-60"
          >
            Ask
          </button>
        </form>

        {nudge && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber/30 bg-amber/5 p-5">
            <p className="text-sm text-warm-gray">{nudge}</p>
            <a
              href="/signup"
              className="shrink-0 rounded-lg bg-amber px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-amber-dark"
            >
              Sign up →
            </a>
          </div>
        )}
      </section>

      {/* Generate Weekly */}
      <section className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleGenerateWeekly}
          className="rounded-lg border border-amber px-5 py-2 text-sm font-medium text-amber transition-colors hover:bg-amber/10"
        >
          Generate weekly reflection
        </button>
        <span className="text-xs italic text-warm-gray-light">
          Preview only — sign up to generate your own.
        </span>
      </section>

      {/* Reflections list */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
          Past reflections
        </h2>

        <div className="space-y-4">
          {reflections.map((r) => (
            <article
              key={r.id}
              className="block rounded-2xl border border-card-border bg-card p-6 transition-all hover:border-amber/30 hover:shadow-sm"
            >
              <div className="flex items-center justify-between text-xs text-warm-gray-light">
                <span className="uppercase tracking-wide">
                  {r.reflection_type === "on_demand"
                    ? "on demand"
                    : r.reflection_type}
                </span>
                <div className="flex items-center gap-2">
                  {r.entry_count_at_generation != null && (
                    <span>{r.entry_count_at_generation} entries</span>
                  )}
                  <span>{shortDate(r.created_at)}</span>
                </div>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {r.title}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-warm-gray">
                {previewBody(r.body)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
