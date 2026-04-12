"use client";

/**
 * Renders reflection body text with styled quoted passages.
 * Patterns like `you wrote: "..."` get an amber left border + italic treatment.
 */

interface ReflectionBodyProps {
  body: string;
}

/**
 * Splits text into segments: plain text and quoted passages.
 * A quoted passage is text inside double quotes that follows "you wrote:" (case-insensitive).
 */
function parseBody(text: string): Array<{ type: "text" | "quote"; content: string }> {
  const segments: Array<{ type: "text" | "quote"; content: string }> = [];
  // Match: "you wrote:" followed by optional whitespace and a double-quoted string
  const pattern = /you\s+wrote:\s*"([^"]+)"/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add any text before this match as a plain segment
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    // Add the quoted text
    segments.push({ type: "quote", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", content: text }];
}

export default function ReflectionBody({ body }: ReflectionBodyProps) {
  const segments = parseBody(body);

  return (
    <div className="space-y-4">
      {segments.map((seg, i) =>
        seg.type === "quote" ? (
          <blockquote
            key={i}
            className="border-l-3 border-amber pl-4 italic text-warm-gray"
          >
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {seg.content}
            </p>
          </blockquote>
        ) : (
          <p
            key={i}
            className="whitespace-pre-wrap text-base leading-relaxed text-foreground"
          >
            {seg.content}
          </p>
        )
      )}
    </div>
  );
}
