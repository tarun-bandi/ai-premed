import questionsData from "@/data/questions.json";

export type Question = {
	id: string;
	question: string;
};

const questions: Question[] = questionsData as Question[];

export function getQuestions(): Question[] {
	return questions;
}

export function getQuestionById(id: string): Question | undefined {
	return questions.find(q => q.id === id);
}
