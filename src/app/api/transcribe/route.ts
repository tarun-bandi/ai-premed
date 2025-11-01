import { ASR_MODEL, getOpenAI } from "@/lib/ai";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const WINDOW_MS = 5 * 60 * 1000; // 5 min
const LIMIT = 10; // per IP per window

interface WhisperTranscriptionResponse {
	text: string;
}

export async function POST(req: Request) {
	try {
		const ip = getClientIp(req.headers);
		const { allowed } = rateLimit(`transcribe:${ip}`, LIMIT, WINDOW_MS);
		if (!allowed) {
			return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
		}

		const formData = await req.formData();
		const file = formData.get("file");

		if (!file || !(file instanceof File)) {
			return new Response(JSON.stringify({ error: "Missing audio file" }), { status: 400 });
		}

		if (file.size > MAX_BYTES) {
			return new Response(JSON.stringify({ error: "File too large (max 5MB)" }), { status: 413 });
		}

		const mime = file.type || "";
		if (!/^audio\/(webm|wav|mpeg|mp4|x-m4a|aac|3gpp|3gpp2)/.test(mime)) {
			return new Response(JSON.stringify({ error: `Unsupported audio type: ${mime}` }), { status: 400 });
		}

		const openai = getOpenAI();
		const transcription = await openai.audio.transcriptions.create({
			file,
			model: ASR_MODEL,
		});

		const transcript = (transcription as unknown as WhisperTranscriptionResponse).text ?? "";

		return new Response(JSON.stringify({ transcript }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Transcription failed";
		return new Response(JSON.stringify({ error: message }), { status: 500 });
	}
}
