"use client";

import { useCallback, useState } from "react";
import Recorder from "@/components/Recorder";
import ScorePanel from "@/components/ScorePanel";

export default function PracticeClient({ question }: { question: string }) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranscribed = useCallback(async ({ transcript }: { transcript: string }) => {
    setTranscript(transcript);
    setGrading(true);
    setError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, transcript }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Grading error (${res.status})`);
      }
      const j = await res.json();
      setResult(j);
    } catch (e: any) {
      setError(e?.message || "Grading failed");
    } finally {
      setGrading(false);
    }
  }, [question]);

  const reset = () => {
    setTranscript(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!result && (
        <Recorder onTranscribed={handleTranscribed} />
      )}

      {grading && <div className="text-sm opacity-70">Grading your response…</div>}

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
            <a className="px-4 py-2 rounded-md bg-foreground text-background" href="/">Pick another question</a>
          </div>
        </div>
      )}
    </div>
  );
}
