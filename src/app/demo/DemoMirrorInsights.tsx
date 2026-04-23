/**
 * Props-driven fork of MirrorInsights for the public /demo route.
 * Renders the same visual layout over static sample data, with no Supabase
 * calls and no links to user-scoped /app/notes/:id routes.
 */
import type { Insight } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  thread: "Thread",
  connection: "Connection",
  pattern: "Pattern",
  forgotten: "Forgotten",
  evolution: "Evolution",
};

const TYPE_DESCRIPTION: Record<string, string> = {
  thread: "Topics that keep returning",
  connection: "Entries that echo each other",
  pattern: "Cycles the Mirror has noticed",
  forgotten: "Things you stopped writing about",
  evolution: "How your language is shifting",
};

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function relative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

interface DemoMirrorInsightsProps {
  insights: Insight[];
}

export default function DemoMirrorInsights({
  insights,
}: DemoMirrorInsightsProps) {
  // Group by type
  const grouped = insights.reduce<Record<string, Insight[]>>((acc, i) => {
    const k = i.insight_type ?? "other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(i);
    return acc;
  }, {});

  const typeOrder = ["pattern", "thread", "connection", "evolution", "forgotten"];

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warm-gray">
          What the Mirror has noticed
        </h2>
        <span className="text-xs italic text-warm-gray-light">
          {insights.length}{" "}
          {insights.length === 1 ? "observation" : "observations"}
        </span>
      </div>

      <div className="space-y-6">
        {typeOrder
          .filter((t) => grouped[t]?.length)
          .map((type) => (
            <div key={type} className="space-y-3">
              <div className="flex items-baseline gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-dark">
                  {TYPE_LABEL[type] ?? type}
                </h3>
                <span className="text-xs italic text-warm-gray-light">
                  {TYPE_DESCRIPTION[type]}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {grouped[type].slice(0, 6).map((i) => (
                  <article
                    key={i.id}
                    className="rounded-xl border border-card-border bg-card p-4 transition-colors hover:border-amber/30"
                  >
                    <div className="flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-wider text-warm-gray-light">
                      <span>{fullDate(i.created_at)}</span>
                      <span>{relative(i.created_at)}</span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                      {i.title}
                    </h4>
                    {i.description && (
                      <p className="mt-2 text-xs leading-relaxed text-warm-gray line-clamp-4">
                        {i.description}
                      </p>
                    )}
                    {i.related_note_ids && i.related_note_ids.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {i.related_note_ids.slice(0, 3).map((id) => (
                          // Demo entries are not real routes — render as inert tags
                          // rather than broken links.
                          <span
                            key={id}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-warm-gray"
                            title="Entry preview hidden in demo"
                          >
                            entry
                          </span>
                        ))}
                        {i.related_note_ids.length > 3 && (
                          <span className="text-[10px] text-warm-gray-light">
                            +{i.related_note_ids.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
