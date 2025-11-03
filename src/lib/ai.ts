import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

let openaiClient: OpenAI | null = null;
export function getOpenAI(): OpenAI {
	if (!openaiClient) {
		const key = process.env.OPENAI_API_KEY;
		if (!key) throw new Error("OPENAI_API_KEY is missing");
		openaiClient = new OpenAI({ apiKey: key });
	}
	return openaiClient;
}

let geminiClient: GoogleGenerativeAI | null = null;
export function getGemini(): GoogleGenerativeAI {
	if (!geminiClient) {
		const key = process.env.GOOGLE_API_KEY;
		if (!key) throw new Error("GOOGLE_API_KEY is missing");
		// SDK v0.11.0+ automatically uses v1 endpoint for gemini-1.5-flash
		geminiClient = new GoogleGenerativeAI(key);
	}
	return geminiClient;
}

export const ASR_MODEL = "whisper-1";
export const GRADE_MODEL = "gpt-4o-mini"; // kept for reference if switching back
// Use gemini-1.5-flash with v1 API
export const GEMINI_MODEL = "gemini-flash-latest";
