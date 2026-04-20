import { Suspense } from "react";
import SignInForm from "@/components/SignInForm";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-card-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <img src="/arc-logo-nav.svg" alt="Arc" width={90} height={26} />
          <a
            href="https://arc-landing-pi.vercel.app"
            className="text-sm text-warm-gray hover:text-foreground transition-colors"
          >
            About Arc
          </a>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="grid w-full max-w-5xl items-center gap-16 md:grid-cols-2">
          {/* Sign-in form first on mobile (order-2 on desktop puts it right) */}
          <div className="flex justify-center md:order-2">
            <Suspense fallback={<div className="h-80 w-full max-w-sm" />}>
              <SignInForm />
            </Suspense>
          </div>
          <div className="md:order-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              The Mirror, on the web
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl">
              An AI that reads your whole story and shows you who you&apos;re
              becoming.
            </h1>
            <p className="mt-6 max-w-md text-warm-gray">
              Sign in to keep writing, revisit past entries, and carry your
              whole vault with you from any browser.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-warm-gray">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span>
                  <span className="font-medium text-foreground">Same account</span>{" "}
                  as the Arc mobile app. Sign in and your notes are there.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span>
                  <span className="font-medium text-foreground">Read and write.</span>{" "}
                  Browse your stream, open any note, add new ones from the keyboard.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span>
                  <span className="font-medium text-foreground">Export anytime.</span>{" "}
                  One click, full vault in a zip. Your data, always yours.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="border-t border-card-border py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-warm-gray">
            &copy; {new Date().getFullYear()} Arc Journal. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-warm-gray">
            <a
              href="https://arc-landing-pi.vercel.app"
              className="hover:text-foreground transition-colors"
            >
              Marketing site
            </a>
            <a
              href="https://arc-landing-pi.vercel.app#pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
