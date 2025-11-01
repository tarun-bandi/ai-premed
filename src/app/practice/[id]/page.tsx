import { getQuestionById } from "@/lib/questions";
import PracticeClient from "@/components/PracticeClient";
import Link from "next/link";

export default function PracticePage({ params }: { params: { id: string } }) {
  const q = getQuestionById(params.id);
  if (!q) {
    return (
      <div className="max-w-3xl mx-auto p-6 sm:p-10">
        <div className="mb-4">Question not found.</div>
        <Link href="/" className="text-blue-600 hover:underline">Back to questions</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-10 space-y-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← All questions</Link>
      <h1 className="text-xl font-semibold">{q.question}</h1>
      <PracticeClient question={q.question} />
    </div>
  );
}
