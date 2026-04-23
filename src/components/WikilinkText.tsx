import { Fragment } from "react";
import Link from "next/link";
import {
  titleKey,
  tokenizeWikilinks,
  type WikilinkTargetMap,
} from "@/lib/wikilinks";

interface WikilinkTextProps {
  text: string;
  targets?: WikilinkTargetMap;
  linkClassName?: string;
  unresolvedClassName?: string;
}

const RESOLVED_CLASS =
  "pointer-events-auto font-medium text-amber-dark underline decoration-amber/50 underline-offset-4 transition-colors hover:text-amber";

const UNRESOLVED_CLASS =
  "cursor-help font-medium text-warm-gray underline decoration-dashed decoration-warm-gray-light/70 underline-offset-4";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function WikilinkText({
  text,
  targets = {},
  linkClassName,
  unresolvedClassName,
}: WikilinkTextProps) {
  const tokens = tokenizeWikilinks(text);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === "text") {
          return <Fragment key={`text-${index}`}>{token.value}</Fragment>;
        }

        const targetId = targets[titleKey(token.value)];

        if (targetId) {
          return (
            <Link
              key={`link-${index}`}
              href={`/app/notes/${targetId}`}
              className={cx(RESOLVED_CLASS, linkClassName)}
            >
              {token.value}
            </Link>
          );
        }

        return (
          <span
            key={`missing-${index}`}
            className={cx(UNRESOLVED_CLASS, unresolvedClassName)}
            title={`no note named '${token.value}' yet`}
          >
            {token.value}
          </span>
        );
      })}
    </>
  );
}
