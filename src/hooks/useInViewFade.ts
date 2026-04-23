"use client";

/**
 * useInViewFade — tiny IntersectionObserver wrapper used by the Temporal Spine.
 *
 * Attach the returned ref to an element. Once it enters the viewport (even a
 * sliver), the hook flips `inView` to true and stops observing. Consumers pair
 * this with CSS transitions to get a one-shot fade+translate reveal. Adding
 * `delayMs` lets callers stagger siblings for rhythm without any JS animation
 * loop.
 *
 * SSR-safe: `inView` defaults to false so the server renders the "pre-reveal"
 * state. The effect only runs on the client, where IntersectionObserver exists.
 */

import { useEffect, useRef, useState } from "react";

export function useInViewFade<T extends HTMLElement = HTMLDivElement>(
  options?: { delayMs?: number; threshold?: number; rootMargin?: string }
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Progressive enhancement: if IntersectionObserver is missing (very old
    // browsers, some test environments), just reveal immediately so nothing
    // stays invisible. Defer the setState a microtask out so we're not
    // synchronously setting state in the effect body (lint: react-hooks/
    // set-state-in-effect).
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setInView(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (options?.delayMs && options.delayMs > 0) {
              const t = setTimeout(() => setInView(true), options.delayMs);
              observer.disconnect();
              return () => clearTimeout(t);
            }
            setInView(true);
            observer.disconnect();
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options?.delayMs, options?.threshold, options?.rootMargin]);

  return { ref, inView };
}
