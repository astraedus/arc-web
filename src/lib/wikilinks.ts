export const WIKILINK_REGEX = /\[\[([^\]\n]+)\]\]/g;

export interface WikilinkToken {
  type: "text" | "wikilink";
  value: string;
  raw?: string;
}

export type WikilinkTargetMap = Record<string, string>;

export interface WikilinkTitleEntry {
  id: string;
  content?: string | null;
  title?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function titleKey(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

export function extractWikilinks(content: string | null | undefined): string[] {
  if (!content) return [];
  const seen = new Map<string, string>();
  const regex = new RegExp(WIKILINK_REGEX.source, "g");

  for (const match of content.matchAll(regex)) {
    const body = (match[1] || "").trim();
    if (!body) continue;
    const key = titleKey(body);
    if (!seen.has(key)) seen.set(key, body);
  }

  return Array.from(seen.values());
}

export function tokenizeWikilinks(
  content: string | null | undefined
): WikilinkToken[] {
  if (!content) return [];

  const tokens: WikilinkToken[] = [];
  const regex = new RegExp(WIKILINK_REGEX.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const body = (match[1] || "").trim();

    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    if (body) {
      tokens.push({ type: "wikilink", value: body, raw: match[0] });
    } else {
      tokens.push({ type: "text", value: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) });
  }

  return tokens;
}

export function deriveTitleFromContent(
  content: string | null | undefined
): string | null {
  if (!content) return null;

  for (const line of content.split(/\r?\n/)) {
    const title = line.trim().replace(/^#{1,6}\s+/, "").trim();
    if (title) return title;
  }

  return null;
}

export function deriveEntryTitle(entry: WikilinkTitleEntry): string | null {
  const explicitTitle = entry.title?.trim();
  if (explicitTitle) return explicitTitle;
  return deriveTitleFromContent(entry.content);
}

function entryTime(entry: WikilinkTitleEntry): number {
  const raw = entry.updated_at || entry.created_at || "";
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildWikilinkTargetMap(
  entries: WikilinkTitleEntry[]
): WikilinkTargetMap {
  const targets: WikilinkTargetMap = {};
  const newestFirst = [...entries].sort((a, b) => entryTime(b) - entryTime(a));

  for (const entry of newestFirst) {
    const title = deriveEntryTitle(entry);
    if (!title) continue;
    const key = titleKey(title);
    if (!targets[key]) targets[key] = entry.id;
  }

  return targets;
}

export function findBacklinksToEntry<T extends WikilinkTitleEntry>(
  entries: T[],
  target: WikilinkTitleEntry
): T[] {
  const targetTitle = deriveEntryTitle(target);
  if (!targetTitle) return [];

  const targetKey = titleKey(targetTitle);

  return entries.filter((entry) => {
    if (entry.id === target.id) return false;
    return extractWikilinks(entry.content).some(
      (linkTitle) => titleKey(linkTitle) === targetKey
    );
  });
}
