import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export const ASR_MODEL = "whisper-1";
export const GRADE_MODEL = "gpt-4o-mini"; // kept for reference if switching back
export const GEMINI_MODEL = "gemini-1.5-flash";
