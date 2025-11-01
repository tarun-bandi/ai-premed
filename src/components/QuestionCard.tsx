import Link from "next/link";
import type { Question } from "@/lib/questions";

export default function QuestionCard({ q }: { q: Question }) {
  return (
    <Link
      href={`/practice/${q.id}`}
      className="block rounded-lg border border-black/10 dark:border-white/20 p-4 hover:bg-black/[.03] dark:hover:bg-white/[.03] transition"
    >
      <div className="text-base font-medium">{q.question}</div>
      <div className="text-xs mt-1 opacity-60">Practice this question →</div>
    </Link>
  );
}
