"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ExportResponse {
  ok: boolean;
  filename: string;
  base64: string;
  stats?: Record<string, number>;
}

export default function ExportButton() {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setStatus("working");
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<ExportResponse>(
        "export-user-data",
        { body: {} }
      );

      if (error) {
        setStatus("error");
        setMessage(
          error.message.includes("not found")
            ? "Export unavailable right now. Try again later."
            : `Export failed: ${error.message}`
        );
        return;
      }

      if (!data || !data.ok || !data.base64) {
        setStatus("error");
        setMessage("Export unavailable right now. Try again later.");
        return;
      }

      // Decode base64 -> Uint8Array -> Blob -> trigger download.
      const binary = atob(data.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "arc-vault.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("done");
      setMessage(
        data.stats
          ? `Exported ${data.stats.notes ?? 0} notes, ${data.stats.nodes ?? 0} map nodes.`
          : "Export complete."
      );
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? `Export failed: ${err.message}`
          : "Export unavailable right now."
      );
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleExport}
        disabled={status === "working"}
        className="rounded-lg bg-amber px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-dark disabled:opacity-60"
      >
        {status === "working" ? "Preparing..." : "Export full vault"}
      </button>
      {message ? (
        <p
          className={`text-sm ${
            status === "error" ? "text-red-600" : "text-warm-gray"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
