"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_SECONDS = 90;
const MAX_BYTES = 5 * 1024 * 1024;

export type RecorderState = "idle" | "recording" | "processing";

type SpeechRecognitionEventLike = {
	resultIndex: number;
	results: Array<{
		isFinal: boolean;
		0: { transcript: string };
	}>;
};

type SpeechRecognitionLike = {
	lang: string;
	interimResults: boolean;
	continuous: boolean;
	onresult: (event: SpeechRecognitionEventLike) => void;
	onerror: (event: { error?: string }) => void;
	onend: () => void;
	start: () => void;
	stop: () => void;
};

export default function Recorder({ onTranscribed }: { onTranscribed: (args: { transcript: string; audioUrl?: string }) => void }) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef<string>("");
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingBrowserASR, setUsingBrowserASR] = useState<boolean>(false);
  const [previewTranscript, setPreviewTranscript] = useState<string>("");

  useEffect(() => {
    let timer: number | null = null;
    if (state === "recording") {
      timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
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
    setStoppedAt(null);
    transcriptRef.current = "";
    setPreviewTranscript("");

    const win = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }) : undefined;
    const SpeechRecognitionCtor = win?.SpeechRecognition || win?.webkitSpeechRecognition || null;

    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let interimSnippet = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0].transcript;
            if (res.isFinal) {
              transcriptRef.current = (transcriptRef.current + " " + text).trim();
            } else {
              interimSnippet += text + " ";
            }
          }
          const combined = (transcriptRef.current + " " + interimSnippet).trim();
          setPreviewTranscript(combined);
        };
        recognition.onerror = (e: { error?: string }) => {
          setError(e?.error || "Speech recognition error");
        };
        recognition.onend = () => {
          if (usingBrowserASR) {
            const text = transcriptRef.current.trim();
            setPreviewTranscript(text);
            if (state !== "idle") {
              onTranscribed({ transcript: text });
            }
            setState("idle");
          }
        };
        recognitionRef.current = recognition;
        setUsingBrowserASR(true);
        recognition.start();
        setState("recording");
        return;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to start speech recognition";
        setError(message);
        setUsingBrowserASR(false);
      }
    }

    // Fallback to MediaRecorder + server ASR if browser API not available
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
            const j: { error?: string } = await res.json().catch(() => ({} as { error?: string }));
            throw new Error(j.error || `Transcription error (${res.status})`);
          }
          const j: { transcript?: string } = await res.json();
          const text = (j.transcript || "").trim();
          setPreviewTranscript(text);
          onTranscribed({ transcript: text, audioUrl });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Transcription failed";
          setError(message);
        } finally {
          setState("idle");
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setState("recording");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Microphone access failed";
      setError(message);
    }
  }, [onTranscribed, usingBrowserASR, state]);

  const stopRecording = useCallback(() => {
    setStoppedAt(elapsed);
    if (usingBrowserASR && recognitionRef.current) {
      try {
        setState("processing");
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      return;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    }
  }, [usingBrowserASR, elapsed]);

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
      {stoppedAt != null && state !== "recording" && (
        <div className="text-xs opacity-70">Stopped at {stoppedAt}s</div>
      )}
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
      {previewTranscript && (
        <div>
          <div className="text-sm font-medium">Transcript</div>
          <div className="text-sm opacity-80 whitespace-pre-wrap">{previewTranscript}</div>
        </div>
      )}
      {!usingBrowserASR && (
        <div className="text-xs opacity-70">Tip: For free transcription, use Chrome where speech recognition is supported.</div>
      )}
    </div>
  );
}
