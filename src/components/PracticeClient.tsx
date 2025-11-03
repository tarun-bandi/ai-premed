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
  const [editableTranscript, setEditableTranscript] = useState<string>("");
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

  const handleTranscribed = useCallback(({ transcript: transcriptText }: { transcript: string; audioUrl?: string }) => {
    // Set transcript for editing, don't auto-submit
    setEditableTranscript(transcriptText);
    setTranscript(transcriptText);
  }, []);

  const handleSubmitFromRecording = useCallback(() => {
    const trimmed = editableTranscript.trim();
    if (trimmed.length === 0) {
      setError("Please enter your response before submitting.");
      return;
    }
    gradeResponse(trimmed);
  }, [editableTranscript, gradeResponse]);

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
    setEditableTranscript("");
    setResult(null);
    setError(null);
    setTypedText("");
  };

  const hasRecordingTranscript = editableTranscript.length > 0;

  return (
    <div className="space-y-6">
      {!result && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-black/10 dark:border-white/15">
            <button
              onClick={() => {
                setMode("record");
                setEditableTranscript("");
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                mode === "record"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-opacity-60 hover:text-opacity-80"
              }`}
            >
              Record
            </button>
            <button
              onClick={() => {
                setMode("type");
                setEditableTranscript("");
              }}
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
            <>
              {!hasRecordingTranscript ? (
                <Recorder onTranscribed={handleTranscribed} />
              ) : (
                <div className="w-full rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="editable-transcript" className="block text-sm font-medium">
                        Your Response (Edit if needed)
                      </label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(editableTranscript);
                        }}
                        className="text-xs px-2 py-1 rounded border border-black/10 dark:border-white/15 hover:bg-black/[.03] dark:hover:bg-white/[.03]"
                      >
                        Copy
                      </button>
                    </div>
                    <textarea
                      id="editable-transcript"
                      value={editableTranscript}
                      onChange={(e) => setEditableTranscript(e.target.value)}
                      placeholder="Your transcribed response will appear here..."
                      className="w-full min-h-[200px] p-3 rounded-md border border-black/10 dark:border-white/15 bg-background text-foreground resize-y"
                      disabled={grading}
                    />
                    <div className="text-xs opacity-70 mt-1">
                      {editableTranscript.length} characters
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditableTranscript("");
                        setTranscript(null);
                      }}
                      className="px-4 py-2 rounded-md border border-black/10 dark:border-white/15"
                      disabled={grading}
                    >
                      Record Again
                    </button>
                    <button
                      onClick={handleSubmitFromRecording}
                      disabled={grading || editableTranscript.trim().length === 0}
                      className="px-4 py-2 rounded-md bg-foreground text-background disabled:opacity-50"
                    >
                      {grading ? "Grading..." : "Submit for Grading"}
                    </button>
                  </div>
                </div>
              )}
            </>
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
