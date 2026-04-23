"use client";

/**
 * SpineGhost — Translucent placeholder cards and dots for the Temporal
 * Spine. These teach new users what will appear in their Mirror *before*
 * they have enough data for real reflections/insights to be generated.
 *
 * Three sub-components are exported:
 *   – GhostStartingDot: A subtle warm-gray dot labeled "today, starting"
 *     used on State A (0 entries) so the spine has at least one anchor.
 *   – GhostReflectionCard: Full-size dashed-border reflection placeholder.
 *     Used when the user has not yet hit the weekly-reflection threshold.
 *   – GhostInsightCard: Compact dashed-border insight placeholder.
 *
 * Visual language:
 *   – Background: `bg-background` (the off-white page bg) so the card
 *     "ghosts" into the page — the dashed border is the primary signal.
 *   – Border: `border-dashed border-card-border` (warm-gray dashed)
 *   – Body text: serif italic, warm-gray, small
 *   – Opacity 0.5 overall
 *   – No hover effects — they are not interactive
 *   – `aria-hidden="true"` on the body so screen readers don't read empty
 *     labels; the wrapper carries an `aria-label` describing the upcoming
 *     feature, which is the meaningful content for assistive tech.
 */

import type { ReactNode } from "react";

// ───────────────────────── starting dot ──────────────────────────

/**
 * Used on State A only. Sits at the top of the spine so there's always a
 * single anchor point even with zero data. Color is a warm-gray (NOT a
 * mood color — the user hasn't told us how they feel yet).
 */
export function GhostStartingDot() {
  return (
    <li
      aria-label="Today — your Mirror is ready to start"
      className="relative opacity-70"
    >
      <div className="relative">
        {/* Dot on the spine */}
        <span
          aria-hidden="true"
          className="
            absolute top-5 z-10 flex h-[14px] w-[14px] items-center justify-center rounded-full
            ring-4 ring-background
            left-[13px] md:left-1/2 md:-translate-x-1/2
          "
          style={{ backgroundColor: "#C9C3B8" }}
        />
        <div className="pl-12 md:pl-0 md:ml-[calc(50%+28px)]">
          <div
            aria-hidden="true"
            className="rounded-2xl border border-dashed border-card-border bg-background px-5 py-4"
            style={{ borderLeft: "4px dashed #C9C3B8" }}
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-warm-gray-light">
              today, starting
            </p>
            <p
              className="mt-2 text-[14px] italic leading-snug text-warm-gray"
              style={{
                fontFamily:
                  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
              }}
            >
              Your Mirror is quiet. Write an entry and it&apos;ll start
              noticing who you are.
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

// ───────────────────────── ghost reflection card ──────────────────────────

interface GhostReflectionCardProps {
  /** Which side of the spine to render on (desktop only) */
  side: "left" | "right";
  /** Small date-area label (e.g. "~4 entries away" or "coming soon") */
  dateLabel: string;
  /** Headline — e.g. "Your first weekly reflection" */
  title: string;
  /** Body copy — purely explanatory */
  body: string;
  /** aria-label describing the upcoming feature */
  ariaLabel: string;
}

export function GhostReflectionCard({
  side,
  dateLabel,
  title,
  body,
  ariaLabel,
}: GhostReflectionCardProps) {
  return (
    <li aria-label={ariaLabel} className="relative opacity-50">
      <div className="relative">
        {/* Dot on the spine — hollow ring, no fill, warm-gray */}
        <span
          aria-hidden="true"
          className="
            absolute top-5 z-10 flex h-[14px] w-[14px] items-center justify-center rounded-full
            ring-4 ring-background border-2 border-dashed
            left-[13px] md:left-1/2 md:-translate-x-1/2
          "
          style={{
            borderColor: "#C9C3B8",
            backgroundColor: "transparent",
          }}
        />
        <div
          className={`
            pl-12 md:pl-0
            ${
              side === "right"
                ? "md:ml-[calc(50%+28px)] md:mr-0"
                : "md:mr-[calc(50%+28px)] md:ml-0"
            }
          `}
        >
          <div
            aria-hidden="true"
            className="rounded-2xl border border-dashed border-card-border bg-background p-5"
            style={{ borderLeft: "4px dashed #C9C3B8" }}
          >
            <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-warm-gray-light">
              <span>weekly reflection</span>
              <span className="italic normal-case tracking-normal">
                {dateLabel}
              </span>
            </div>
            <h3
              className="mt-2 text-[17px] italic leading-snug text-warm-gray"
              style={{
                fontFamily:
                  "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
              }}
            >
              {title}
            </h3>
            <p className="mt-2 text-[13px] italic leading-relaxed text-warm-gray-light">
              {body}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

// ───────────────────────── ghost insight card ──────────────────────────

interface GhostInsightCardProps {
  dateLabel: string;
  title: string;
  body: string;
  ariaLabel: string;
}

export function GhostInsightCard({
  dateLabel,
  title,
  body,
  ariaLabel,
}: GhostInsightCardProps) {
  return (
    <li aria-label={ariaLabel} className="relative opacity-50">
      <div className="relative">
        {/* Small dot on the spine — hollow ring */}
        <span
          aria-hidden="true"
          className="
            absolute top-3 z-10 h-[8px] w-[8px] rounded-full
            ring-[3px] ring-background border border-dashed
            left-[16px] md:left-1/2 md:-translate-x-1/2
          "
          style={{
            borderColor: "#C9C3B8",
            backgroundColor: "transparent",
          }}
        />
        <div className="pl-12 md:pl-0 md:ml-[calc(50%+28px)] md:max-w-[340px]">
          <div
            aria-hidden="true"
            className="rounded-xl border border-dashed border-card-border/70 bg-background/70 px-4 py-3"
            style={{ borderLeft: "2px dashed #C9C3B8" }}
          >
            <div className="flex items-baseline justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-warm-gray-light">
              <span>insight</span>
              <span className="italic normal-case tracking-normal">
                {dateLabel}
              </span>
            </div>
            <h4 className="mt-1 text-[13px] font-semibold italic leading-snug text-warm-gray">
              {title}
            </h4>
            <p className="mt-1.5 text-[12px] italic leading-relaxed text-warm-gray-light">
              {body}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

// ───────────────────────── layout spacer ──────────────────────────

/**
 * Optional wrapper used by TemporalSpine when it needs to group multiple
 * ghosts together without breaking the top-level `<ol>` structure. Not
 * currently used — kept for symmetry with future states. Accepts children
 * and renders them unchanged; exists so the top-level ghost block can be
 * labelled as a single a11y landmark if we need to.
 */
export function GhostGroup({
  children,
  ariaLabel,
}: {
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
