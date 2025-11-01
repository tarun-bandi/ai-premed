import { GEMINI_MODEL, gemini } from "@/lib/ai";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import type { GradeResult } from "@/types/grade";

export const runtime = "nodejs";

const WINDOW_MS = 5 * 60 * 1000; // 5 min
const LIMIT = 10; // per IP per window

const SYSTEM_PROMPT = `You are an admissions interviewer for med school. Grade the candidate’s answer.
Return concise JSON only with keys: scores { contentRelevance, structureClarity, empathyProfessionalism, concisionTiming }, overall (average, .5 allowed), strength (short sentence), improvements (3 short items). Be strict but fair; ignore ASR disfluencies unless excessive.`;

function defaultGradeResult(): GradeResult {
	return {
		scores: {
			contentRelevance: 0,
			structureClarity: 0,
			empathyProfessionalism: 0,
			concisionTiming: 0,
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
		return {
			scores: {
				contentRelevance: Number(scores.contentRelevance ?? 0),
				structureClarity: Number(scores.structureClarity ?? 0),
				empathyProfessionalism: Number(scores.empathyProfessionalism ?? 0),
				concisionTiming: Number(scores.concisionTiming ?? 0),
			},
			overall: Number(obj.overall ?? 0),
			strength: String(obj.strength ?? ""),
			improvements: Array.isArray(obj.improvements) ? obj.improvements.map(String) : [],
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

		if (!process.env.GOOGLE_API_KEY) {
			return new Response(JSON.stringify({ error: "Server misconfigured: GOOGLE_API_KEY missing" }), { status: 500 });
		}

		const body = await req.json().catch(() => null) as { question?: string; transcript?: string } | null;
		const question = body?.question;
		const transcript = body?.transcript;

		if (!question || !transcript) {
			return new Response(JSON.stringify({ error: "Missing question or transcript" }), { status: 400 });
		}

		const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });

		const prompt = `${SYSTEM_PROMPT}\n\nQuestion: "${question}"\n\nTranscript:\n"${transcript}"`;

		const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
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
