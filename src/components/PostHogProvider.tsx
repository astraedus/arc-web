"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

// Initialize PostHog on the client exactly once. We call this inside a
// provider (rather than at module top-level) so it runs only in the
// browser and only after the app shell mounts — SSR-safe.
//
// Guarded on NEXT_PUBLIC_POSTHOG_KEY: if the key isn't configured the
// provider becomes a passthrough and all `posthog.capture(...)` calls in
// the app silently no-op (posthog-js tolerates this). This keeps the
// provider friendly for forks/local dev without the key.

let initialized = false;

function initPostHog() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    // Autocapture is enabled by default; we already instrument meaningful
    // events manually (note_created, mirror_question_asked, etc.). Leaving
    // the default on catches anything we miss, which is the point.
    capture_pageview: true,
    person_profiles: "identified_only",
    // Avoid noisy recording / heatmap beacons until we actually use them.
    disable_session_recording: true,
  });
  initialized = true;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initPostHog();
  }, []);
  return <>{children}</>;
}
