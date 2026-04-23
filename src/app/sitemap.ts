import type { MetadataRoute } from "next";

import { COMPETITORS } from "./alternative/_data/content";

// Canonical public origin. Used in sitemap entries + alternative-page canonicals.
// If we switch domains, update here + `generateMetadata` in alternative pages.
const SITE_URL = "https://arc-journal.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/alternative`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const competitorEntries: MetadataRoute.Sitemap = COMPETITORS.map((c) => ({
    url: `${SITE_URL}/alternative/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...competitorEntries];
}
