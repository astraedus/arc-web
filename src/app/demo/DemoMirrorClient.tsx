"use client";

/**
 * Demo-mode fork of MirrorClient. Renders the unified Temporal Spine + Ask UI,
 * but any Ask / Generate action shows a signup nudge instead of calling
 * Supabase. The goal: show the UX, not expose a free call-to-LLM endpoint.
 */
import { useMemo, useState } from "react";
import TemporalSpine from "@/components/TemporalSpine";
import LayerToggle from "@/components/LayerToggle";
import { DEFAULT_LAYER, type Layer } from "@/lib/spine-layer";
import type { Reflection, Insight, JournalEntry } from "@/lib/types";

interface DemoMirrorClientProps {
  initialReflections: Reflection[];
  initialInsights?: Insight[];
  initialEntries?: JournalEntry[];
}

export default function DemoMirrorClient({
  initialReflections,
  initialInsights = [],
  initialEntries = [],
}: DemoMirrorClientProps) {
  const reflections = initialReflections;
  const insights = initialInsights;
  const entries = initialEntries;
  const [question, setQuestion] = useState("");
  const [nudge, setNudge] = useState<string | null>(null);
  const [layer, setLayer] = useState<Layer>(DEFAULT_LAYER);

  const counts = useMemo(
    () => ({
      all: reflections.length + insights.length + entries.length,
      entries: entries.length,
      reflections: reflections.length,
      insights: insights.length,
    }),
    [reflections.length, insights.length, entries.length]
  );

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

      {/* Unified Temporal Spine — reflections + insights braided together.
          inert=true because /app/mirror/:id is auth-gated; we don't want
          to send demo visitors to a 401. */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-warm-gray">
              Alex&apos;s spine
            </h2>
            <p className="mt-1 text-xs italic text-warm-gray-light">
              {reflections.length} reflections · {insights.length} observations
              {entries.length > 0 && ` · ${entries.length} entries`}
            </p>
          </div>
          <LayerToggle value={layer} onChange={setLayer} counts={counts} />
        </div>
        <TemporalSpine
          reflections={reflections}
          insights={insights}
          entries={entries}
          layer={layer}
          inert
          showGhosts={false}
        />
      </section>
    </div>
  );
}
