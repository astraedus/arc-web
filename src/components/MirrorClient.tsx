"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import TemporalSpine from "@/components/TemporalSpine";
import WikilinkText from "@/components/WikilinkText";
import LayerToggle from "@/components/LayerToggle";
import { DEFAULT_LAYER, parseLayer, type Layer } from "@/lib/spine-layer";
import type { Reflection, Insight, JournalEntry } from "@/lib/types";
import type { WikilinkTargetMap } from "@/lib/wikilinks";

interface MirrorClientProps {
  initialReflections: Reflection[];
  initialInsights?: Insight[];
  wikilinkTargets?: WikilinkTargetMap;
  /**
   * Full journal entries (capped server-side) for the signed-in user.
   * Threaded into TemporalSpine so the "entries" layer + drill-down
   * expansion panels have real data to render without a client-side
   * round-trip.
   */
  initialEntries?: JournalEntry[];
  /**
   * Total journal_entries count for the signed-in user. Threaded down
   * to TemporalSpine so it can decide which ghost placeholder cards to
   * render in sparse-data states.
   */
  entryCount?: number;
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
  initialInsights = [],
  initialEntries = [],
  wikilinkTargets,
  entryCount,
}: MirrorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  const [reflections, setReflections] =
    useState<Reflection[]>(initialReflections);

  // Layer state — which slice of the spine is showing. Bookmarkable via
  // ?layer=<value>. Tolerant parser so malformed URLs fall back to "all"
  // rather than exploding.
  const [layer, setLayer] = useState<Layer>(() =>
    parseLayer(searchParams.get("layer"))
  );

  // When the user flips the toggle, mirror that into the URL (replace,
  // not push — this shouldn't pollute history). We keep any other query
  // params (e.g. ?ask=) that happen to be present.
  function handleLayerChange(next: Layer) {
    setLayer(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_LAYER) {
      params.delete("layer");
    } else {
      params.set("layer", next);
    }
    const qs = params.toString();
    router.replace(`/app/mirror${qs ? `?${qs}` : ""}`);
  }

  // Counts shown as subtle numerals on the toggle pills. useMemo because
  // initialEntries / insights can be 100-item arrays and .length on
  // reflections re-renders often enough.
  const counts = useMemo(
    () => ({
      all:
        reflections.length +
        initialInsights.length +
        initialEntries.length,
      entries: initialEntries.length,
      reflections: reflections.length,
      insights: initialInsights.length,
    }),
    [reflections.length, initialInsights.length, initialEntries.length]
  );

  // If ?ask=... is present in URL (from CommandPalette), prefill + auto-submit once.
  const autoAskedRef = useRef(false);
  useEffect(() => {
    if (autoAskedRef.current) return;
    const askParam = searchParams.get("ask");
    if (!askParam) return;
    autoAskedRef.current = true;
    setQuestion(askParam);
    // Strip the param so a refresh doesn't re-ask.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ask");
    router.replace(`/app/mirror${params.toString() ? `?${params.toString()}` : ""}`);
    // Submit shortly after mount.
    setTimeout(() => {
      const form = document.querySelector("form#ask-mirror-form");
      if (form) (form as HTMLFormElement).requestSubmit();
    }, 100);
  }, [searchParams, router]);

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

      posthog.capture("mirror_question_asked");

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

      posthog.capture("mirror_reflection_generated", { type: "weekly" });
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
        <form id="ask-mirror-form" onSubmit={handleAsk} className="flex gap-3">
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
            className="rounded-lg bg-amber px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-amber-dark disabled:opacity-60"
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
              <WikilinkText text={answer} targets={wikilinkTargets} />
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

      {/* Unified Temporal Spine — reflections + insights braided together.
          We ALWAYS render the spine (no bail-out on empty data). When
          data is sparse, TemporalSpine itself renders translucent ghost
          placeholder cards teaching the user what's coming. This is the
          "progressive atlas" pattern — the feature never hides. */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-warm-gray">
              Your spine
            </h2>
            <p className="mt-1 text-xs italic text-warm-gray-light">
              {reflections.length}{" "}
              {reflections.length === 1 ? "reflection" : "reflections"}
              {initialInsights.length > 0 && (
                <>
                  {" · "}
                  {initialInsights.length}{" "}
                  {initialInsights.length === 1
                    ? "observation"
                    : "observations"}
                </>
              )}
            </p>
          </div>
          <LayerToggle value={layer} onChange={handleLayerChange} counts={counts} />
        </div>

        <TemporalSpine
          reflections={reflections}
          insights={initialInsights}
          entries={initialEntries}
          layer={layer}
          wikilinkTargets={wikilinkTargets}
          entryCount={entryCount}
          showGhosts
        />

        {entryCount === 0 && reflections.length === 0 && (
          <p className="pt-6 text-center text-sm italic text-warm-gray-light">
            Your Mirror is quiet. Write an entry and it&apos;ll start
            noticing who you are.
          </p>
        )}
      </section>
    </div>
  );
}
