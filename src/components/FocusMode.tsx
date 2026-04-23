"use client";

import { useEffect, useState } from "react";
import WikilinkText from "@/components/WikilinkText";
import type { WikilinkTargetMap } from "@/lib/wikilinks";

interface FocusModeProps {
  content: string;
  date: string;
  wikilinkTargets?: WikilinkTargetMap;
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function FocusMode({
  content,
  date,
  wikilinkTargets,
}: FocusModeProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // 'f' key opens focus mode (only when not typing in an input)
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (!isTyping && e.key === "f" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground"
        aria-label="Open reading focus mode"
        title="Reading focus (press f)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        Focus
        <kbd className="ml-1 rounded bg-muted px-1 text-[10px] font-medium">
          f
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-background/98 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative mx-auto w-full max-w-2xl px-8 py-20 sm:px-12">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="fixed right-6 top-6 rounded-lg border border-card-border bg-card/80 p-2 text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground backdrop-blur-sm"
              aria-label="Close focus mode"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <p className="text-center text-xs uppercase tracking-[0.2em] text-warm-gray-light">
              {fullDate(date)}
            </p>

            <div
              className="mt-12 whitespace-pre-wrap text-center"
              style={{
                fontFamily:
                  "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
                fontSize: "1.25rem",
                lineHeight: "1.85",
                letterSpacing: "0.005em",
                color: "#2B2822",
              }}
            >
              <WikilinkText text={content} targets={wikilinkTargets} />
            </div>

            <div className="mt-16 text-center text-xs italic text-warm-gray-light">
              press <kbd className="rounded bg-muted px-1.5 py-0.5 font-medium">esc</kbd> to leave
            </div>
          </div>
        </div>
      )}
    </>
  );
}
