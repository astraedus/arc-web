"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio, pickAudioMimeType } from "@/lib/transcribe";

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  onRecordingStateChange?: (recording: boolean) => void;
  onTranscribingStateChange?: (transcribing: boolean) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  onTranscript,
  onRecordingStateChange,
  onTranscribingStateChange,
  disabled,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [supported, setSupported] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Detect browser support on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    setSupported(ok);
  }, []);

  const cleanup = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    setError(null);
    if (!supported) {
      setError("This browser doesn't support voice recording.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Microphone access was blocked. Allow it in browser settings.");
      } else {
        setError("Couldn't access the microphone.");
      }
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickAudioMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      // Fall back to default if unsupported
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = (e) => {
      setError(`Recording error: ${(e as ErrorEvent).message ?? "unknown"}`);
      stopRecording();
    };

    recorder.onstop = async () => {
      setRecording(false);
      onRecordingStateChange?.(false);

      const blob = new Blob(chunksRef.current, { type: mimeType });
      cleanup();

      if (blob.size === 0) {
        setError("Nothing was recorded.");
        return;
      }

      setTranscribing(true);
      onTranscribingStateChange?.(true);
      try {
        const result = await transcribeAudio(blob);
        if (result.transcript) {
          onTranscript(result.transcript);
        } else {
          setError("Couldn't make out the audio.");
        }
      } catch (err) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Transcription failed.";
        setError(msg);
      } finally {
        setTranscribing(false);
        onTranscribingStateChange?.(false);
      }
    };

    recorder.start();
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    elapsedTimerRef.current = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 250);
    setRecording(true);
    onRecordingStateChange?.(true);
  }, [supported, onRecordingStateChange, onTranscript, onTranscribingStateChange, cleanup]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      // Already stopped or never started — just clean up
      cleanup();
      setRecording(false);
      onRecordingStateChange?.(false);
    }
  }, [cleanup, onRecordingStateChange]);

  const handleClick = useCallback(() => {
    if (disabled || transcribing) return;
    if (recording) stopRecording();
    else void startRecording();
  }, [disabled, transcribing, recording, startRecording, stopRecording]);

  const seconds = String(elapsed % 60).padStart(2, "0");
  const minutes = Math.floor(elapsed / 60);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || transcribing || !supported}
        aria-pressed={recording}
        aria-label={recording ? "Stop recording" : "Start voice recording"}
        title={
          !supported
            ? "Voice recording isn't supported in this browser"
            : recording
              ? "Stop recording"
              : "Hold to dictate"
        }
        className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
          recording
            ? "border-amber-dark bg-amber/15"
            : "border-card-border bg-card hover:border-amber/40"
        } ${disabled || !supported ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {recording && (
          <span className="absolute inset-0 animate-ping rounded-full bg-amber/30" />
        )}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={recording ? "relative text-amber-dark" : "relative text-warm-gray"}
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {recording && (
        <div className="flex items-center gap-2 text-xs text-amber-dark">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-dark" />
          <span className="tabular-nums">
            {minutes}:{seconds}
          </span>
          <span className="italic text-warm-gray">listening...</span>
        </div>
      )}

      {transcribing && (
        <span className="text-xs italic text-warm-gray">
          turning audio into text...
        </span>
      )}

      {error && !recording && !transcribing && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}

      {!supported && !recording && !transcribing && !error && (
        <span className="text-xs italic text-warm-gray-light">
          voice not supported here
        </span>
      )}
    </div>
  );
}
