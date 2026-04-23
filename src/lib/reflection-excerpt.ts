/**
 * Produces a plain, social-card-ready excerpt from a reflection body.
 *
 *  - Collapses whitespace.
 *  - Strips the Mirror's "you wrote:" framing so the excerpt reads as prose.
 *  - Truncates to ~maxChars on a word boundary with a trailing ellipsis when cut.
 */
export function makeReflectionExcerpt(body: string, maxChars = 200): string {
  if (!body) return "";

  // Collapse all whitespace to single spaces first.
  let text = body.replace(/\s+/g, " ").trim();

  // Remove Mirror-specific narrator framing so the excerpt reads as prose.
  text = text.replace(/you\s+wrote:\s*/gi, "");

  // Strip wrapping quote marks that often surround the quoted passages.
  text = text.replace(/[“”"]/g, "");

  if (text.length <= maxChars) return text;

  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > 80 ? cut.slice(0, lastSpace) : cut;

  // Strip trailing punctuation before appending the ellipsis for a cleaner look.
  return safeCut.replace(/[\s,.:;!?\-–—]+$/, "") + "…";
}
