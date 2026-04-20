import { createClient } from "@/lib/supabase/client";

export interface OrganizedResult {
  organized: string;
  action_items: string[];
  summary: string;
}

/**
 * Send a raw transcript to the gemini-proxy edge function for cleanup.
 * Returns null if the call fails or content is too short to organize.
 */
export async function organizeTranscript(
  rawText: string
): Promise<OrganizedResult | null> {
  if (!rawText || rawText.trim().length < 50) {
    return null;
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.functions.invoke("gemini-proxy", {
      body: { type: "organize-transcript", payload: { content: rawText } },
    });

    if (error || !data?.ok || !data.result) return null;
    const result = data.result;
    if (typeof result.organized !== "string") return null;

    return {
      organized: result.organized,
      action_items: Array.isArray(result.action_items) ? result.action_items : [],
      summary: typeof result.summary === "string" ? result.summary : "",
    };
  } catch {
    return null;
  }
}
