"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_SECONDS = 90;
const MAX_BYTES = 5 * 1024 * 1024;

export type RecorderState = "idle" | "recording" | "processing";

export default function Recorder({ onTranscribed }: { onTranscribed: (args: { transcript: string; audioUrl?: string }) => void }) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (state === "recording") {
      timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state === "recording" && elapsed >= MAX_SECONDS) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, state]);

  const startRecording = useCallback(async () => {
    setError(null);
    setElapsed(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > MAX_BYTES) {
          setError("Recording too large. Try a shorter answer.");
          setState("idle");
          return;
        }
        setState("processing");
        const audioUrl = URL.createObjectURL(blob);
        try {
          const fd = new FormData();
          fd.append("file", blob, "answer.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || `Transcription error (${res.status})`);
          }
          const j = await res.json();
          onTranscribed({ transcript: j.transcript || "", audioUrl });
        } catch (e: any) {
          setError(e?.message || "Transcription failed");
        } finally {
          setState("idle");
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setState("recording");
    } catch (e: any) {
      setError(e?.message || "Microphone access failed");
    }
  }, [onTranscribed]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    }
  }, []);

  const canRecord = useMemo(() => state === "idle", [state]);

  return (
    <div className="w-full rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">Status</div>
        <div className="text-sm font-medium capitalize">{state}</div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">Timer</div>
        <div className="text-lg font-semibold">{elapsed}s</div>
      </div>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-md bg-foreground text-background disabled:opacity-50"
          onClick={startRecording}
          disabled={!canRecord}
        >
          Record
        </button>
        <button
          className="px-4 py-2 rounded-md border border-black/10 dark:border-white/15 disabled:opacity-50"
          onClick={stopRecording}
          disabled={state !== "recording"}
        >
          Stop
        </button>
      </div>
      {state === "recording" && (
        <div className="text-xs opacity-70">Speak up to {MAX_SECONDS}s. Auto-stops at limit.</div>
      )}
      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}
