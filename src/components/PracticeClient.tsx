"use client";

import { useCallback, useState } from "react";
import Recorder from "@/components/Recorder";
import ScorePanel from "@/components/ScorePanel";
import type { GradeResult } from "@/types/grade";
import Link from "next/link";

type InputMode = "record" | "type";

export default function PracticeClient({ question }: { question: string }) {
  const [mode, setMode] = useState<InputMode>("record");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [typedText, setTypedText] = useState<string>("");
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gradeResponse = useCallback(async (text: string) => {
    setTranscript(text);
    setGrading(true);
    setError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, transcript: text }),
      });
      if (!res.ok) {
        const j: { error?: string } = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(j.error || `Grading error (${res.status})`);
      }
      const j: GradeResult = await res.json();
      setResult(j);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Grading failed";
      setError(message);
    } finally {
      setGrading(false);
    }
  }, [question]);

  const handleTranscribed = useCallback(async ({ transcript }: { transcript: string }) => {
    await gradeResponse(transcript);
  }, [gradeResponse]);

  const handleSubmitTyped = useCallback(() => {
    const trimmed = typedText.trim();
    if (trimmed.length === 0) {
      setError("Please enter your response before submitting.");
      return;
    }
    gradeResponse(trimmed);
  }, [typedText, gradeResponse]);

  const reset = () => {
    setTranscript(null);
    setResult(null);
    setError(null);
    setTypedText("");
  };

  return (
    <div className="space-y-6">
      {!result && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-black/10 dark:border-white/15">
            <button
              onClick={() => setMode("record")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === "record"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-opacity-60 hover:text-opacity-80"
              }`}
            >
              Record
            </button>
            <button
              onClick={() => setMode("type")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === "type"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-opacity-60 hover:text-opacity-80"
              }`}
            >
              Type
            </button>
          </div>

          {mode === "record" ? (
            <Recorder onTranscribed={handleTranscribed} />
          ) : (
            <div className="w-full rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
              <div>
                <label htmlFor="typed-response" className="block text-sm font-medium mb-2">
                  Your Response
                </label>
                <textarea
                  id="typed-response"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full min-h-[200px] p-3 rounded-md border border-black/10 dark:border-white/15 bg-background text-foreground resize-y"
                  disabled={grading}
                />
                <div className="text-xs opacity-70 mt-1">
                  {typedText.length} characters
                </div>
              </div>
              <button
                onClick={handleSubmitTyped}
                disabled={grading || typedText.trim().length === 0}
                className="px-4 py-2 rounded-md bg-foreground text-background disabled:opacity-50"
              >
                {grading ? "Grading..." : "Submit for Grading"}
              </button>
            </div>
          )}
        </div>
      )}

      {grading && (
        <div className="space-y-3">
          <div className="text-sm opacity-70">Grading your response…</div>
          {transcript && (
            <div>
              <div className="text-sm font-medium">Your Response</div>
              <div className="text-sm opacity-80 whitespace-pre-wrap">{transcript}</div>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      {result && (
        <div className="space-y-4">
          <ScorePanel
            overall={result.overall}
            scores={result.scores}
            strength={result.strength}
            improvements={result.improvements}
            transcript={transcript || undefined}
          />
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-md border border-black/10 dark:border-white/15" onClick={reset}>Try again</button>
            <Link className="px-4 py-2 rounded-md bg-foreground text-background" href="/">Pick another question</Link>
          </div>
        </div>
      )}
    </div>
  );
}
