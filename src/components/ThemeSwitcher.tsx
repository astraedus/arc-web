"use client";

import { useEffect, useState } from "react";

type Theme = "paper" | "space" | "garden" | "ocean" | "brutalist";

const THEMES: Array<{
  key: Theme;
  label: string;
  hint: string;
  swatches: [string, string, string];
}> = [
  {
    key: "paper",
    label: "Paper",
    hint: "warm cream + amber (default)",
    swatches: ["#FAFAF8", "#E8A849", "#2B2822"],
  },
  {
    key: "space",
    label: "Space",
    hint: "deep night sky, faint stars",
    swatches: ["#0B0F1A", "#FFB861", "#ECE7DA"],
  },
  {
    key: "garden",
    label: "Garden",
    hint: "sage, terracotta, sand",
    swatches: ["#F4F1E8", "#C76747", "#5E6A4F"],
  },
  {
    key: "ocean",
    label: "Ocean",
    hint: "deep teal + warm coral",
    swatches: ["#0C2230", "#FF9F7A", "#88AAB5"],
  },
  {
    key: "brutalist",
    label: "Brutalist",
    hint: "ink on paper, monospace",
    swatches: ["#FFFFFF", "#000000", "#555555"],
  },
];

const STORAGE_KEY = "arc-theme";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "paper") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "paper";
  const t = window.localStorage.getItem(STORAGE_KEY);
  if (t && ["paper", "space", "garden", "ocean", "brutalist"].includes(t)) {
    return t as Theme;
  }
  return "paper";
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("paper");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function selectTheme(t: Theme) {
    setTheme(t);
    applyTheme(t);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, t);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs italic text-warm-gray">
        Pick the room you want to write in.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {THEMES.map((t) => {
          const active = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTheme(t.key)}
              aria-pressed={active}
              className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-amber/60 bg-amber/5 shadow-sm"
                  : "border-card-border bg-card hover:border-amber/30"
              }`}
            >
              {/* Swatch trio */}
              <div
                className="flex h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-card-border"
                aria-hidden="true"
              >
                {t.swatches.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex-1"
                    style={{ background: color }}
                  />
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {t.label}
                  </span>
                  {active && (
                    <span className="text-[10px] uppercase tracking-wider text-amber-dark">
                      current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs italic text-warm-gray-light">
                  {t.hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
