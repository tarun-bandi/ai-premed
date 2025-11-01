type Scores = {
  contentRelevance?: number;
  structureClarity?: number;
  empathyProfessionalism?: number;
  concisionTiming?: number;
};

export default function ScorePanel({
  overall,
  scores,
  strength,
  improvements,
  transcript,
}: {
  overall?: number;
  scores?: Scores;
  strength?: string;
  improvements?: string[];
  transcript?: string;
}) {
  if (overall == null) return null;

  return (
    <div className="w-full rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-70">Overall</div>
        <div className="text-xl font-semibold">{overall.toFixed(1)} / 5</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <ScoreRow label="Content relevance" value={scores?.contentRelevance} />
        <ScoreRow label="Structure & clarity" value={scores?.structureClarity} />
        <ScoreRow label="Empathy & professionalism" value={scores?.empathyProfessionalism} />
        <ScoreRow label="Concision & timing" value={scores?.concisionTiming} />
      </div>

      {strength ? (
        <div>
          <div className="text-sm font-medium">Strength</div>
          <div className="text-sm opacity-80">{strength}</div>
        </div>
      ) : null}

      {improvements && improvements.length ? (
        <div>
          <div className="text-sm font-medium">Improvements</div>
          <ul className="list-disc pl-5 text-sm opacity-80">
            {improvements.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {transcript ? (
        <div>
          <div className="text-sm font-medium">Transcript</div>
          <div className="text-sm opacity-80 whitespace-pre-wrap">{transcript}</div>
        </div>
      ) : null}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/15 p-2">
      <div className="opacity-70">{label}</div>
      <div className="font-medium">{value != null ? value : "-"}</div>
    </div>
  );
}
