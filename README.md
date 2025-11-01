This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## MVP: Premed Interview Practice
- Pick a question, record a 60–90s answer, transcribe via Whisper, and get AI grading with brief feedback.

### Environment
Create a `.env.local` at the project root:

```
# OpenAI Whisper (ASR)
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
- Set `OPENAI_API_KEY` and `GOOGLE_API_KEY` in your hosting environment (e.g., Vercel → Project Settings → Environment Variables).
- Then deploy.

---

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)
