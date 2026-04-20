"use client";

import { useState } from "react";

interface RawOrganizedToggleProps {
  organized: string;
  raw: string;
  organizedByAi?: boolean;
  transcriptionSource?: string | null;
}

type Mode = "organized" | "raw" | "both";

const SOURCE_LABEL: Record<string, string> = {
  gemini_flash: "Gemini Flash",
  native_ios: "iOS native voice",
  native_android: "Android native voice",
  manual: "typed",
};

export default function RawOrganizedToggle({
  organized,
  raw,
  organizedByAi,
  transcriptionSource,
}: RawOrganizedToggleProps) {
  const [mode, setMode] = useState<Mode>("organized");

  const sourceLabel =
    transcriptionSource && SOURCE_LABEL[transcriptionSource]
      ? SOURCE_LABEL[transcriptionSource]
      : transcriptionSource ?? null;

  return (
    <div className="space-y-4">
      {/* Toggle bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-card-border bg-card p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("organized")}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === "organized"
                ? "bg-amber/15 text-amber-dark font-medium"
                : "text-warm-gray hover:text-foreground"
            }`}
          >
            ✦ organized
          </button>
          <button
            type="button"
            onClick={() => setMode("raw")}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === "raw"
                ? "bg-amber/15 text-amber-dark font-medium"
                : "text-warm-gray hover:text-foreground"
            }`}
          >
            raw
          </button>
          <button
            type="button"
            onClick={() => setMode("both")}
            className={`hidden rounded-full px-3 py-1 transition-colors md:inline-block ${
              mode === "both"
                ? "bg-amber/15 text-amber-dark font-medium"
                : "text-warm-gray hover:text-foreground"
            }`}
          >
            side by side
          </button>
        </div>

        {(sourceLabel || organizedByAi) && (
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-warm-gray-light">
            {sourceLabel && <span>captured via {sourceLabel}</span>}
            {organizedByAi && sourceLabel && <span>·</span>}
            {organizedByAi && <span className="text-amber-dark">AI cleaned</span>}
          </div>
        )}
      </div>

      {/* Body */}
      {mode === "organized" && (
        <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {organized}
        </div>
      )}

      {mode === "raw" && (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-warm-gray-light">
            what you actually said
          </p>
          <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {raw}
          </div>
        </div>
      )}

      {mode === "both" && (
        <div className="grid gap-6 md:grid-cols-2 md:divide-x md:divide-card-border">
          <div className="md:pr-6">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-amber-dark">
              ✦ organized
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {organized}
            </div>
          </div>
          <div className="md:pl-6">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-warm-gray-light">
              what you actually said
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-warm-gray">
              {raw}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
