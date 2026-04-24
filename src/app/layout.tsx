import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arc Mirror — a diary that reads you back",
  description:
    "Honest journaling. The Mirror reads everything you've written and shows you the threads you can't see yourself.",
  openGraph: {
    title: "Arc Mirror — a diary that reads you back",
    description:
      "Honest journaling. The Mirror reads everything you've written and shows you the threads you can't see yourself.",
    url: "https://arc-web-pi.vercel.app",
    siteName: "Arc",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arc Mirror — a diary that reads you back",
    description:
      "Honest journaling. The Mirror reads everything you've written and shows you the threads you can't see yourself.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Apply stored color theme BEFORE React hydrates to avoid a flash of
            the default palette. Anything malformed/missing falls back to paper. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('arc-theme');if(t&&['space','garden','ocean','brutalist'].indexOf(t)>-1){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
