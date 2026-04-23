"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ShareReflectionButtonProps {
  reflectionId: string;
  title: string;
}

type CopyTarget = "link" | "og";

/**
 * Reveals a small menu with three share actions for a reflection:
 *   - Copy public link  (/r/<id>)
 *   - Copy OG image URL (/api/og/reflection/<id>)
 *   - Share on X        (opens the tweet composer pre-filled)
 *
 * Rendered only for reflections the caller has determined are shareable.
 */
export default function ShareReflectionButton({
  reflectionId,
  title,
}: ShareReflectionButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve URLs on the client so they always match the current host
  // (works on preview deploys, localhost, and prod alike). We keep these in
  // state rather than useMemo so the values flip from "" on the SSR pass to
  // the real URLs after hydration — useMemo would be stuck at the SSR value
  // because its deps never change.
  const [urls, setUrls] = useState<{
    publicUrl: string;
    ogUrl: string;
    tweetHref: string;
  }>({ publicUrl: "", ogUrl: "", tweetHref: "#" });

  useEffect(() => {
    const origin = window.location.origin;
    const publicUrl = `${origin}/r/${encodeURIComponent(reflectionId)}`;
    const ogUrl = `${origin}/api/og/reflection/${encodeURIComponent(reflectionId)}`;
    const tweetText = title
      ? `${title} — a reflection from my Arc Mirror`
      : "A reflection from my Arc Mirror";
    const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(publicUrl)}`;
    setUrls({ publicUrl, ogUrl, tweetHref });
  }, [reflectionId, title]);

  const { publicUrl, ogUrl, tweetHref } = urls;

  // Close on outside click / escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(ev: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reset the "Copied!" label after a moment.
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = useCallback(
    async (target: CopyTarget) => {
      const value = target === "link" ? publicUrl : ogUrl;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(target);
      } catch (err) {
        console.error("Clipboard write failed:", err);
        // Fallback: prompt with the value so the user can copy manually.
        window.prompt("Copy this URL:", value);
      }
    },
    [publicUrl, ogUrl]
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-amber hover:text-amber"
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
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share this reflection
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-card-border bg-card shadow-lg"
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => copy("link")}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span>Copy public link</span>
            {copied === "link" ? (
              <span className="text-xs text-amber">Copied</span>
            ) : (
              <span className="text-xs text-warm-gray-light">/r/…</span>
            )}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => copy("og")}
            className="flex w-full items-center justify-between border-t border-card-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span>Copy card image URL</span>
            {copied === "og" ? (
              <span className="text-xs text-amber">Copied</span>
            ) : (
              <span className="text-xs text-warm-gray-light">PNG</span>
            )}
          </button>
          <a
            role="menuitem"
            href={tweetHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between border-t border-card-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <span>Share on X</span>
            <span className="text-xs text-warm-gray-light">opens tab</span>
          </a>
        </div>
      )}
    </div>
  );
}
