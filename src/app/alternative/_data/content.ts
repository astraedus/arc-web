/**
 * Per-competitor seed content for `/alternative/[competitor]` SEO pages.
 *
 * Tone rules (read CLAUDE.md before touching):
 *  - Honest. If the competitor wins a feature row, say so.
 *  - Grounded, not salesy. Arc's brand is "honest about who you're becoming" —
 *    ad copy would contradict that.
 *  - Never start CTAs with "I" or "We". No fake testimonials. No case studies.
 *  - Short sentences. The goal is to read like a friend explaining their switch,
 *    not a marketing landing page.
 *
 * To add a new competitor: add an entry to COMPETITORS and it is picked up by
 *   `generateStaticParams`, the index page, and the sitemap automatically.
 */

export type ComparisonWinner = "arc" | "competitor" | "tie";

export interface ComparisonRow {
  /** Short feature name, e.g. "Daily journaling". */
  feature: string;
  /** One-sentence note on how Arc handles it. */
  arc: string;
  /** One-sentence note on how the competitor handles it. */
  competitor: string;
  /** Which side genuinely wins this row. Be honest — ties and competitor wins are OK. */
  winner: ComparisonWinner;
}

export interface CompetitorContent {
  /** URL slug — lives at /alternative/[slug]. */
  slug: string;
  /** Display name, e.g. "Day One". */
  name: string;
  /** One-line tagline shown under the H1. */
  tagline: string;
  /** HTML <title>. Keep under 60 chars. */
  metaTitle: string;
  /** Meta description. 140–160 chars ideal. */
  metaDescription: string;
  /** 2–3 short paragraphs on why a user on this competitor might switch to Arc. */
  whySwitch: string[];
  /** One honest paragraph on what the user will miss by leaving the competitor. */
  whatYoullMiss: string;
  /** The side-by-side feature comparison table. 6–8 rows. */
  comparison: ComparisonRow[];
  /** Rough switching guide — 3–5 steps. */
  switchingGuide: {
    step: string;
    detail: string;
  }[];
}

export const COMPETITORS: CompetitorContent[] = [
  // ─── Day One ──────────────────────────────────────────────────────────────
  {
    slug: "day-one",
    name: "Day One",
    tagline:
      "Day One is the polished iOS journal. Arc is the honest, cross-platform one.",
    metaTitle: "Arc — the honest alternative to Day One",
    metaDescription:
      "Day One is beautiful, but it's Apple-only and doesn't really reflect your entries back at you. Arc is a cross-platform journal with an AI that reads what you write.",
    whySwitch: [
      "Day One is the nicest-looking journal app on iOS, and that's the catch. If you live on Android, Windows, or a Chromebook, the best features aren't there. Arc runs on your phone and in any browser from the same vault.",
      "Day One stores entries beautifully. It doesn't really read them back. Arc's AI compresses what you write into patterns — recurring people, shifts in mood, themes you keep circling — and surfaces them when they matter. A journal that only stores is a notebook; a journal that reflects is a mirror.",
      "Day One's subscription sits around USD 35/year for features most people assume are standard (search across devices, unlimited photos). Arc's pricing is simpler and the export is one click, not a menu dive.",
    ],
    whatYoullMiss:
      "Day One's polish is real. If you're on iOS only and want the most refined visual experience for writing, nothing else quite matches it. The typography, the templates, the photo journaling — it's been iterated on for over a decade. Arc is more honest about patterns in your life, but Day One is more beautiful to type into. That trade-off is worth naming.",
    comparison: [
      {
        feature: "Platform support",
        arc: "iOS, Android, and any web browser — same vault.",
        competitor: "iOS and macOS first. Android exists but lags, Windows is via web only.",
        winner: "arc",
      },
      {
        feature: "Daily journaling",
        arc: "Plain, fast capture with optional titles and wikilinks.",
        competitor: "Rich editor, templates, prompts. More featureful for the act of writing itself.",
        winner: "competitor",
      },
      {
        feature: "AI reflection",
        arc: "Longitudinal AI reads your entries and surfaces patterns, people, mood shifts.",
        competitor: "Limited AI — writing prompts and on-this-day recaps. No real synthesis.",
        winner: "arc",
      },
      {
        feature: "The 'mirror' view",
        arc: "A globe/visualisation of your entries over time. See who you were at different moments.",
        competitor: "Calendar and map views of entries. No longitudinal self-portrait.",
        winner: "arc",
      },
      {
        feature: "Privacy model",
        arc: "End-to-end encrypted sync. Your AI reflection runs on your vault, not on a training set.",
        competitor: "End-to-end encryption available. Mature, audited, well-documented.",
        winner: "tie",
      },
      {
        feature: "Export",
        arc: "One click — full vault as a zip, any time.",
        competitor: "PDF, JSON, plain-text exports. More formats, but slower to reach.",
        winner: "tie",
      },
      {
        feature: "Photos & media",
        arc: "Attach photos to entries. No stitched memoir layouts yet.",
        competitor: "Strong: audio, video, photo journaling with beautiful book-style layouts.",
        winner: "competitor",
      },
      {
        feature: "Pricing",
        arc: "Free tier covers most writers. Paid tier is simple and flat.",
        competitor: "Premium at ~USD 34.99/year. Features that feel like they should be free are gated.",
        winner: "arc",
      },
    ],
    switchingGuide: [
      {
        step: "Export from Day One",
        detail:
          "Settings → Account → Export → choose JSON (preserves timestamps and metadata). Save the .zip somewhere you can find it.",
      },
      {
        step: "Create an Arc account",
        detail:
          "Sign up with email. One vault spans your phone and the web — no separate accounts.",
      },
      {
        step: "Import your entries",
        detail:
          "Drop the Day One JSON into Arc's import screen. Timestamps and entry bodies come across intact.",
      },
      {
        step: "Let the Mirror catch up",
        detail:
          "Arc's AI takes a pass over your history — usually a few minutes for years of entries. Patterns and people start surfacing immediately.",
      },
      {
        step: "Keep writing",
        detail:
          "No migration plan survives real life. Write one entry in Arc today. That's the switch.",
      },
    ],
  },

  // ─── Notion ───────────────────────────────────────────────────────────────
  {
    slug: "notion",
    name: "Notion",
    tagline:
      "Notion is a workspace. Arc is a journal. The difference matters more than it sounds.",
    metaTitle: "Arc — the honest alternative to Notion for journaling",
    metaDescription:
      "Notion is a great workspace but a mediocre journal. Arc is built specifically for reflection — AI that reads your entries, a mirror view of who you're becoming.",
    whySwitch: [
      "Notion is a block-based workspace. People use it as a journal by building templates, databases, and daily pages. It works, kind of. The friction is the workspace itself — every time you open Notion to write, you're also reminded of your tasks, your wiki, your meeting notes. Journaling needs a softer container.",
      "Notion's AI is built for work: summarise this doc, draft a reply. It doesn't know how to read a year of your diary entries and tell you what you keep coming back to. Arc is designed around exactly that loop — capture, compress, reflect.",
      "Notion entries are rows in a database. You can view them, but there's no concept of a longitudinal self. Arc's Mirror visualises your writing over time as a globe — moments, moods, people — so the journal becomes a self-portrait, not a log.",
    ],
    whatYoullMiss:
      "Notion is genuinely one of the best software products of the last decade. If your journaling overlaps with project notes, reading lists, or a personal wiki, leaving Notion means losing that integration. Arc is not a workspace and is not trying to be. If you want everything under one roof, Notion stays the right choice. Arc is for people who want a journal that is only a journal, and that feels like a relief rather than a limitation.",
    comparison: [
      {
        feature: "Purpose-built for journaling",
        arc: "Yes — writing, reflection, and the Mirror are the whole app.",
        competitor: "No — journaling is a DIY configuration on top of a workspace tool.",
        winner: "arc",
      },
      {
        feature: "Daily capture friction",
        arc: "Open the app, write. No template to pick, no database to populate.",
        competitor: "Open Notion, navigate to today's page, add row. Doable, but not frictionless.",
        winner: "arc",
      },
      {
        feature: "AI reflection",
        arc: "Longitudinal AI surfaces patterns across all your entries.",
        competitor: "Notion AI can summarise a page. It doesn't synthesise your whole journal.",
        winner: "arc",
      },
      {
        feature: "Structured data / databases",
        arc: "Minimal — titles and wikilinks. Not a database tool.",
        competitor: "Best in class. Relational databases, views, filters, rollups.",
        winner: "competitor",
      },
      {
        feature: "Privacy model",
        arc: "End-to-end encrypted vault. Your entries aren't training data.",
        competitor: "Standard cloud encryption. Notion AI may process your content for features.",
        winner: "arc",
      },
      {
        feature: "Mobile journaling",
        arc: "Built for phone-first capture. Voice notes, quick entries.",
        competitor: "Mobile app works, but the block editor is awkward for longform thumb-typing.",
        winner: "arc",
      },
      {
        feature: "Export",
        arc: "One click. Full vault as a zip.",
        competitor: "Workspace export as Markdown/HTML. Works, but preserves Notion-isms.",
        winner: "tie",
      },
      {
        feature: "Pricing for personal use",
        arc: "Free tier is generous for solo journalers.",
        competitor: "Free for personal use, but AI features cost extra per seat.",
        winner: "tie",
      },
    ],
    switchingGuide: [
      {
        step: "Export your journal database",
        detail:
          "In Notion: ⋯ menu on the database → Export → Markdown & CSV. This gives you one file per entry plus a CSV index.",
      },
      {
        step: "Create an Arc account",
        detail: "Sign up, install the mobile app if you want phone capture.",
      },
      {
        step: "Import the Markdown files",
        detail:
          "Drop the exported folder into Arc. Dates are parsed from Notion's Created field; entry bodies come across as Markdown.",
      },
      {
        step: "Leave the rest in Notion",
        detail:
          "Project notes, wikis, reading lists — leave them where they are. Arc is only replacing the journal part.",
      },
      {
        step: "Write one entry",
        detail:
          "The workflow is different: no template, no database, just a text box. Most people adapt in a week.",
      },
    ],
  },

  // ─── Journey ──────────────────────────────────────────────────────────────
  {
    slug: "journey",
    name: "Journey",
    tagline:
      "Journey was the answer for Android journalers in 2015. Arc is the answer in 2026.",
    metaTitle: "Arc — the honest alternative to Journey",
    metaDescription:
      "Journey pioneered cross-platform journaling on Android and Windows. Ten years on, the UX is dated and the AI is weak. Arc is the modern answer.",
    whySwitch: [
      "Journey was an important app. For years it was the best cross-platform journaling option if you were on Android, Windows, or Linux. The founders deserve respect for making something that filled a real gap. Ten years later, the interface feels its age — cluttered sidebars, dense menus, features piled on top of features.",
      "Journey added AI as a layer — Coach, prompts, chat. Useful, but bolted on. Arc was built from the ground up around a longitudinal AI that reads what you write and reflects it back. The difference shows: Arc surfaces patterns across months and years, not just reactions to today's entry.",
      "Journey's sync across platforms was a triumph in 2015. In 2026 it's the baseline. What matters now is what the journal does with your writing. Arc's Mirror turns years of entries into a view of who you are becoming — a self-portrait that updates as you live.",
    ],
    whatYoullMiss:
      "Journey has been iterated on for over a decade. The feature list is long — mood tracking, weather, location, activity sync with fitness trackers, multi-book organisation, gift journals. If you rely on any of those, Arc is more minimal on purpose. Journey is a Swiss Army knife. Arc is a mirror.",
    comparison: [
      {
        feature: "Platform support",
        arc: "iOS, Android, web — one vault, one account.",
        competitor: "iOS, Android, Mac, Windows, Chrome, web. Wider coverage.",
        winner: "competitor",
      },
      {
        feature: "Interface",
        arc: "Calm, minimal, serif accents. Writing comes first.",
        competitor: "Dense. Sidebars, toolbars, menus. Feels dated next to modern journaling apps.",
        winner: "arc",
      },
      {
        feature: "AI reflection",
        arc: "Longitudinal synthesis across your whole vault.",
        competitor: "Coach and chat features. Reactive to individual entries, not cross-sectional.",
        winner: "arc",
      },
      {
        feature: "Mood & habit tracking",
        arc: "Light — patterns emerge from entries, not from forms you fill in.",
        competitor: "Comprehensive: mood, weather, activity, habits all tracked explicitly.",
        winner: "competitor",
      },
      {
        feature: "The mirror / self-portrait view",
        arc: "Globe visualisation of entries over time. Unique to Arc.",
        competitor: "Timeline and calendar views. No longitudinal self-portrait.",
        winner: "arc",
      },
      {
        feature: "Privacy",
        arc: "End-to-end encrypted vault. AI runs on your entries, not your identity.",
        competitor: "Encrypted storage, cloud sync via Google Drive or iCloud by default.",
        winner: "arc",
      },
      {
        feature: "Export",
        arc: "One click — full vault as a zip.",
        competitor: "Multiple formats: PDF, DOCX, JSON. More choices, more clicks.",
        winner: "tie",
      },
      {
        feature: "Active development pace",
        arc: "New — iterating fast, shipping the core weekly.",
        competitor: "Mature — stable, incremental updates.",
        winner: "tie",
      },
    ],
    switchingGuide: [
      {
        step: "Export from Journey",
        detail:
          "In Journey: Settings → Export → choose JSON (keeps timestamps + metadata). Save the archive.",
      },
      {
        step: "Create an Arc account",
        detail: "Sign up on phone or web — one vault across both.",
      },
      {
        step: "Import your entries",
        detail:
          "Drop the Journey JSON into Arc's import screen. Mood and weather metadata is preserved as entry tags.",
      },
      {
        step: "Let the Mirror build",
        detail:
          "Arc's AI reads through your history. For a long Journey archive this may take several minutes.",
      },
      {
        step: "Write tomorrow's entry in Arc",
        detail:
          "The only real test of a switch is whether you open the new app tomorrow. Don't delete Journey until you have.",
      },
    ],
  },
];

/**
 * Build-time lookup: slug → content. Throws if called with an unknown slug,
 * which surfaces as a 404 via `notFound()`.
 */
export function getCompetitor(slug: string): CompetitorContent | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
