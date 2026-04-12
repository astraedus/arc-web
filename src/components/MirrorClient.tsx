"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ClientDate from "@/components/ClientDate";
import type { Reflection } from "@/lib/types";

interface MirrorClientProps {
  initialReflections: Reflection[];
}

function previewBody(text: string, lines = 3) {
  const split = text.split("\n").filter((l) => l.trim());
  const slice = split.slice(0, lines).join("\n");
  return slice.length < text.length ? `${slice}...` : slice;
}

function friendlyMirrorError(raw: string): string {
  if (
    raw.includes("non-2xx") ||
    raw.includes("Edge Function") ||
    raw.includes("FunctionsHttpError") ||
    raw.includes("FunctionsRelayError") ||
    raw.includes("FunctionsFetchError") ||
    raw.includes("ECONNREFUSED") ||
    raw.includes("500")
  ) {
    return "The Mirror is currently unavailable. Please try again in a moment.";
  }
  if (raw.includes("401") || raw.includes("Unauthorized") || raw.includes("JWT")) {
    return "Your session has expired. Please sign out and sign back in.";
  }
  if (raw.includes("timeout") || raw.includes("AbortError")) {
    return "The request took too long. Please try again.";
  }
  return "Something went wrong. Please try again in a moment.";
}

export default function MirrorClient({
  initialReflections,
}: MirrorClientProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  const [reflections, setReflections] =
    useState<Reflection[]>(initialReflections);

  async function handleAsk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim() || asking) return;

    setAskError(null);
    setAnswer(null);
    setAsking(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke(
        "mirror-reflect",
        { body: { type: "on_demand", question: question.trim() } }
      );

      if (error) {
        setAskError(friendlyMirrorError(error.message));
        setAsking(false);
        return;
      }

      const reflection = data?.reflection;
      if (reflection?.body) {
        setAnswer(reflection.body);
        // Add to reflections list
        setReflections((prev) => [reflection as Reflection, ...prev]);
      } else {
        setAnswer(typeof data === "string" ? data : JSON.stringify(data));
      }
    } catch (err) {
      setAskError(
        friendlyMirrorError(err instanceof Error ? err.message : "")
      );
    } finally {
      setAsking(false);
    }
  }

  async function handleGenerateWeekly() {
    if (generating) return;
    setGenerating(true);
    setGenMessage(null);

    try {
      const supabase = createClient();
      const { data: weeklyData, error } = await supabase.functions.invoke(
        "mirror-reflect",
        { body: { type: "weekly" } }
      );

      if (error) {
        setGenMessage(friendlyMirrorError(error.message));
        setGenerating(false);
        return;
      }

      setGenMessage("Weekly reflection generated.");

      // Add the new reflection to the list immediately if available
      if (weeklyData?.reflection) {
        setReflections((prev) => [weeklyData.reflection as Reflection, ...prev]);
        return; // Skip the re-fetch since we already have it
      }

      // Refresh the reflections list
      const { data: fresh } = await supabase
        .from("reflections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fresh) setReflections(fresh as Reflection[]);
    } catch (err) {
      setGenMessage(
        friendlyMirrorError(err instanceof Error ? err.message : "")
      );
    } finally {
      setGenerating(false);
    }
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
            disabled={asking || !question.trim()}
            className="rounded-lg bg-amber px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-dark disabled:opacity-60"
          >
            {asking ? "Thinking..." : "Ask"}
          </button>
        </form>

        {asking && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber/20 bg-amber/5 p-5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber" />
            </span>
            <span className="text-sm text-warm-gray">
              The Mirror is reading your journal...
            </span>
          </div>
        )}

        {askError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {askError}
          </div>
        )}

        {answer && !asking && (
          <div className="rounded-2xl border border-amber/20 bg-card p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {answer}
            </p>
          </div>
        )}
      </section>

      {/* Generate Weekly */}
      <section className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleGenerateWeekly}
          disabled={generating}
          className="rounded-lg border border-amber px-5 py-2 text-sm font-medium text-amber transition-colors hover:bg-amber/10 disabled:opacity-60"
        >
          {generating ? "Generating..." : "Generate weekly reflection"}
        </button>
        {genMessage && (
          <span className="text-sm text-warm-gray">{genMessage}</span>
        )}
      </section>

      {/* Reflections list */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-gray">
          Past reflections
        </h2>

        {reflections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-card-border bg-card p-8 text-center">
            <p className="text-sm text-warm-gray">
              No reflections yet. Ask the Mirror a question or generate a weekly
              reflection to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((r) => (
              <Link
                key={r.id}
                href={`/app/mirror/${r.id}`}
                className="block rounded-2xl border border-card-border bg-card p-6 transition-all hover:border-amber/30 hover:shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-warm-gray-light">
                  <span className="uppercase tracking-wide">
                    {r.reflection_type}
                  </span>
                  <div className="flex items-center gap-2">
                    {r.entry_count_at_generation != null && (
                      <span>
                        {r.entry_count_at_generation} entries
                      </span>
                    )}
                    <ClientDate iso={r.created_at} format="date" />
                  </div>
                </div>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  {r.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-warm-gray">
                  {previewBody(r.body)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
