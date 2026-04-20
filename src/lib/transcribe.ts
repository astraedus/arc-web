import { createClient } from "@/lib/supabase/client";

export type TranscriptionResult = {
  transcript: string;
  source: "gemini_flash";
  duration_seconds: number | null;
  detected_language: string | null;
};

export type TranscriptionError = {
  message: string;
  status?: number;
};

/**
 * Send a recorded audio Blob to the transcribe-audio edge function and
 * return the cleaned transcript. Audio is NOT stored server-side.
 *
 * Throws TranscriptionError on failure with a user-friendly message.
 */
export async function transcribeAudio(
  blob: Blob,
  language?: string
): Promise<TranscriptionResult> {
  if (!blob || blob.size === 0) {
    throw { message: "Nothing was recorded." } satisfies TranscriptionError;
  }

  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw { message: "Your session has expired. Sign in again.", status: 401 } satisfies TranscriptionError;
  }

  const filename = inferFilename(blob.type);
  const form = new FormData();
  form.set("audio", blob, filename);
  if (language) form.set("language", language);

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-audio`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch (err) {
    throw {
      message:
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Network error reaching the transcription service.",
    } satisfies TranscriptionError;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw {
      message: friendly(res.status, text),
      status: res.status,
    } satisfies TranscriptionError;
  }

  type RawResponse = {
    transcript?: string;
    source?: string;
    duration_seconds?: number | null;
    detected_language?: string | null;
    error?: string;
  };

  let parsed: RawResponse;
  try {
    parsed = (await res.json()) as RawResponse;
  } catch {
    throw { message: "Transcription returned invalid response." } satisfies TranscriptionError;
  }

  if (parsed.error) {
    throw { message: parsed.error } satisfies TranscriptionError;
  }

  return {
    transcript: (parsed.transcript ?? "").trim(),
    source: "gemini_flash",
    duration_seconds: parsed.duration_seconds ?? null,
    detected_language: parsed.detected_language ?? null,
  };
}

function inferFilename(mime: string): string {
  if (mime.includes("webm")) return "audio.webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "audio.m4a";
  if (mime.includes("ogg")) return "audio.ogg";
  if (mime.includes("wav")) return "audio.wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "audio.mp3";
  return "audio.webm";
}

function friendly(status: number, body: string): string {
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 413) return "That recording is too long for one upload. Try a shorter clip.";
  if (status === 502) return "The transcription service is unreachable right now. Try again in a moment.";
  if (status === 500) return "Transcription service is not configured.";
  // Try to extract error.message from JSON body if present
  try {
    const j = JSON.parse(body);
    if (typeof j?.error === "string") return j.error;
  } catch {
    /* ignore */
  }
  return `Transcription failed (HTTP ${status}).`;
}

/**
 * Pick the best supported MediaRecorder mime type for this browser.
 * Webm/opus is preferred (Chrome/Edge/Firefox); Safari needs mp4/m4a.
 */
export function pickAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "audio/webm";
}
