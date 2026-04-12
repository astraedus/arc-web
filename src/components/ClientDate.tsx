"use client";

import { useEffect, useState } from "react";

interface ClientDateProps {
  iso: string;
  format?: "date" | "datetime" | "short";
  className?: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Renders a date string that only formats on the client to avoid
 * React hydration mismatch errors (#418) caused by server/client
 * timezone differences in toLocaleString output.
 */
export default function ClientDate({
  iso,
  format = "datetime",
  className,
}: ClientDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a stable placeholder on the server. Using the raw ISO
    // date portion avoids locale-dependent mismatches.
    const fallback = iso.split("T")[0] || "";
    return <span className={className}>{fallback}</span>;
  }

  const formatted =
    format === "datetime"
      ? formatDateTime(iso)
      : format === "short"
        ? formatShort(iso)
        : formatDate(iso);
  return <span className={className}>{formatted}</span>;
}
