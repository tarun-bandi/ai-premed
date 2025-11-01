import { GEMINI_MODEL, gemini } from "@/lib/ai";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const WINDOW_MS = 5 * 60 * 1000; // 5 min
const LIMIT = 10; // per IP per window

const SYSTEM_PROMPT = `You are an admissions interviewer for med school. Grade the candidate’s answer.
Return concise JSON only with keys: scores { contentRelevance, structureClarity, empathyProfessionalism, concisionTiming }, overall (average, .5 allowed), strength (short sentence), improvements (3 short items). Be strict but fair; ignore ASR disfluencies unless excessive.`;

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

    const body = await req.json().catch(() => null);
    const question: string | undefined = body?.question;
    const transcript: string | undefined = body?.transcript;

    if (!question || !transcript) {
      return new Response(JSON.stringify({ error: "Missing question or transcript" }), { status: 400 });
    }

    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `${SYSTEM_PROMPT}\n\nQuestion: "${question}"\n\nTranscript:\n"${transcript}"`;

    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = result.response.text() || "{}";

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { overall: 0, scores: {}, strength: "", improvements: [] };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Grading failed" }), { status: 500 });
  }
}
