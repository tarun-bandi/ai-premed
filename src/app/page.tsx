import { getQuestions } from "@/lib/questions";
import QuestionCard from "@/components/QuestionCard";

export default function Home() {
  const questions = getQuestions();
  return (
    <div className="max-w-3xl mx-auto min-h-screen p-6 sm:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Premed Interview Practice - Created by Tarun Bandi</h1>
        <p className="opacity-70 text-sm">Pick a question below, record a 60–90s answer, and get instant feedback.</p>
      </header>
      <main className="grid gap-3">
        {questions.map(q => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </main>
    </div>
  );
}
