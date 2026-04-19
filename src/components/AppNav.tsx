"use client";

import { useState } from "react";
import Link from "next/link";

interface AppNavProps {
  email: string | null;
}

export default function AppNav({ email }: AppNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/app" className="flex items-center">
          <img src="/arc-logo-nav.svg" alt="Arc" width={90} height={26} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            href="/app"
            className="group flex items-center gap-1.5 text-warm-gray hover:text-foreground transition-colors"
          >
            <span className="opacity-70 group-hover:opacity-100">🌊</span>
            <span>Stream</span>
          </Link>
          <Link
            href="/app/mirror"
            className="group flex items-center gap-1.5 text-warm-gray hover:text-foreground transition-colors"
          >
            <span className="opacity-70 group-hover:opacity-100">🪞</span>
            <span>Mirror</span>
          </Link>
          <Link
            href="/app/graph"
            className="group flex items-center gap-1.5 text-warm-gray hover:text-foreground transition-colors"
          >
            <span className="opacity-70 group-hover:opacity-100">✦</span>
            <span>Graph</span>
          </Link>
          <Link
            href="/app/new"
            className="group flex items-center gap-1.5 text-warm-gray hover:text-foreground transition-colors"
          >
            <span className="opacity-70 group-hover:opacity-100">✎</span>
            <span>Write</span>
          </Link>
          <Link
            href="/app/profile"
            className="group flex items-center gap-1.5 text-warm-gray hover:text-foreground transition-colors"
          >
            <span className="opacity-70 group-hover:opacity-100">◎</span>
            <span>You</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              const ev = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(ev);
            }}
            className="hidden items-center gap-1.5 rounded-lg border border-card-border px-2.5 py-1 text-xs text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground lg:flex"
            aria-label="Open command palette"
            title="Command palette (⌘K)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <kbd className="font-medium">⌘K</kbd>
          </button>
          {email ? (
            <span
              className="hidden max-w-[160px] truncate text-xs text-warm-gray-light sm:inline"
              title={email}
            >
              {email}
            </span>
          ) : null}
          <form action="/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center rounded-lg border border-card-border p-2 text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg
              width="20"
              height="20"
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
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="border-t border-card-border bg-background px-6 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <Link
              href="/app"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-warm-gray hover:text-foreground transition-colors py-1"
            >
              <span>🌊</span>
              <span>Stream</span>
            </Link>
            <Link
              href="/app/mirror"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-warm-gray hover:text-foreground transition-colors py-1"
            >
              <span>🪞</span>
              <span>Mirror</span>
            </Link>
            <Link
              href="/app/graph"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-warm-gray hover:text-foreground transition-colors py-1"
            >
              <span>✦</span>
              <span>Graph</span>
            </Link>
            <Link
              href="/app/new"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-warm-gray hover:text-foreground transition-colors py-1"
            >
              <span>✎</span>
              <span>Write</span>
            </Link>
            <Link
              href="/app/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 text-warm-gray hover:text-foreground transition-colors py-1"
            >
              <span>◎</span>
              <span>You</span>
            </Link>
            {email ? (
              <span className="text-xs text-warm-gray-light">{email}</span>
            ) : null}
            <form action="/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-warm-gray transition-colors hover:border-amber/40 hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
