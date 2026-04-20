# Arc Web

Arc Web is the browser vault for Arc, the journaling product built around an honest diary and a longitudinal AI mirror. It gives signed-in users a calmer desktop surface for reading, searching, exporting, and exploring their writing history.

Live URLs:
- App: https://arc-web-pi.vercel.app
- Landing page: https://arc-landing-pi.vercel.app

## What It Includes

- Supabase auth and server-rendered session handling
- Stream view for journal entries
- Mirror reflections and question flow
- Constellation and River of Time visualizations
- Vault export controls
- Voice transcription via the Supabase `transcribe-audio` edge function

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in real values:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Required for local development:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional but recommended:

- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`

Documented placeholders for planned server-side work:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Notes

- The transcription flow expects the Supabase edge function at `functions/v1/transcribe-audio`.
- PostHog is installed but the provider is currently disabled until the live key is restored.
- This repo is one surface of the broader Arc product. The landing page lives separately in `../arc-landing`.
