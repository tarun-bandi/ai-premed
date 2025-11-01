This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## MVP: Premed Interview Practice
- Pick a question, speak a 60–90s answer, get AI grading and brief feedback.
- Default ASR (speech-to-text): Chrome Web Speech API (free, Chrome/Edge). Optional server Whisper fallback.

### Environment
Create a `.env.local` at the project root (only needed if using server Whisper ASR and for Gemini grading):

```
# OpenAI Whisper (ASR fallback)
OPENAI_API_KEY=your_openai_api_key

# Gemini (grading)
GOOGLE_API_KEY=your_gemini_api_key
```

### Run locally

```bash
npm run dev
```

Open http://localhost:3000 to use the app.

### Deploy
- Set env vars in Vercel → Project Settings → Environment Variables:
  - `GOOGLE_API_KEY` (required for grading)
  - `OPENAI_API_KEY` (only if you plan to use server Whisper fallback)
- Deploy, then test in Chrome for free in-browser transcription.

---

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)
