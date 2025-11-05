import { GEMINI_MODEL, getGemini } from "@/lib/ai";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import type { GradeResult } from "@/types/grade";

export const runtime = "nodejs";

const WINDOW_MS = 5 * 60 * 1000; // 5 min
const LIMIT = 10; // per IP per window

const SYSTEM_PROMPT = `You are a medical school admissions interviewer using a standardized rubric.

Evaluate the candidate's answer and return ONLY valid JSON:

{
  "scores": {
    "introduction": number (1–4),
    "mentalPreparation": number (1–4),
    "personality": number (1–4),
    "ethics": number (1–4),
    "schoolSpecificInterest": number (1–4)
  },
  "overall": number (average of scores, may be .5),
  "strength": "short sentence summarizing the candidate's strongest quality",
  "improvements": ["3 short, specific suggestions for improvement"]
}

Grading reference (1=Poor, 2=Fair, 3=Good, 4=Excellent):

Introduction: punctual, professional appearance, friendly demeanor, confident introduction.  

Mental Preparation: answers promptly, confidently, thoroughly yet concisely, with enthusiasm and thoughtfulness.  

Personality: likable, memorable, genuine enthusiasm for medicine.  

Ethics: thoughtful reasoning, credible and informed opinions, awareness of current issues.  

School-Specific Interest: mentions reasons for choosing this school, demonstrates prior research, curiosity to learn more.

IMPORTANT: You MUST include "strength" (a meaningful sentence) and "improvements" (an array of exactly 3 actionable suggestions) in your response. These are required fields.

Be strict but fair. Ignore minor ASR disfluencies unless excessive. No commentary outside JSON.`;

function defaultGradeResult(): GradeResult {
	return {
		scores: {
			introduction: 0,
			mentalPreparation: 0,
			personality: 0,
			ethics: 0,
			schoolSpecificInterest: 0,
		},
		overall: 0,
		strength: "",
		improvements: [],
	};
}

function safeParseGradeResult(text: string): GradeResult {
	try {
		const obj = JSON.parse(text) as Partial<GradeResult>;
		if (!obj || typeof obj !== "object") return defaultGradeResult();
		const scores = obj.scores ?? ({} as GradeResult["scores"]);
		
		// Ensure improvements is an array with at least some items
		let improvements: string[] = [];
		if (Array.isArray(obj.improvements)) {
			improvements = obj.improvements.map(String).filter(s => s.trim().length > 0);
		}
		// If empty, provide fallback
		if (improvements.length === 0) {
			improvements = [
				"Review the question and ensure your answer directly addresses all aspects",
				"Practice structuring your response with a clear introduction, body, and conclusion",
				"Add specific examples or personal experiences to strengthen your points"
			];
		}
		
		// Ensure strength is meaningful
		let strength = String(obj.strength ?? "").trim();
		if (strength.length === 0) {
			strength = "Your response demonstrates effort and engagement with the question.";
		}
		
		return {
			scores: {
				introduction: Number(scores.introduction ?? 0),
				mentalPreparation: Number(scores.mentalPreparation ?? 0),
				personality: Number(scores.personality ?? 0),
				ethics: Number(scores.ethics ?? 0),
				schoolSpecificInterest: Number(scores.schoolSpecificInterest ?? 0),
			},
			overall: Number(obj.overall ?? 0),
			strength,
			improvements,
		};
	} catch {
		return defaultGradeResult();
	}
}

export async function POST(req: Request) {
	try {
		const ip = getClientIp(req.headers);
		const { allowed } = rateLimit(`grade:${ip}`, LIMIT, WINDOW_MS);
		if (!allowed) {
			return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
		}

		const body = await req.json().catch(() => null) as { question?: string; transcript?: string } | null;
		const question = body?.question;
		const transcript = body?.transcript;

		if (!question || !transcript) {
			return new Response(JSON.stringify({ error: "Missing question or transcript" }), { status: 400 });
		}

		const gemini = getGemini();
		const model = gemini.getGenerativeModel({ 
			model: GEMINI_MODEL,
		});

		const prompt = `${SYSTEM_PROMPT}\n\nQuestion: "${question}"\n\nTranscript:\n"${transcript}"`;

		const result = await model.generateContent(prompt);
		const text = result.response.text() || "{}";

		const data: GradeResult = safeParseGradeResult(text);

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Grading failed";
		return new Response(JSON.stringify({ error: message }), { status: 500 });
	}
}
