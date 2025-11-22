AI Web Research Frontend
========================

Next.js frontend for the AI web research agent. The backend (FastAPI + Playwright) handles search, scraping, screenshots, summarization, reliability scoring, and PDF export. This app provides:
- Landing page (`/landing`) describing the product.
- Main app (`/`) to run research jobs, poll status, view sources with screenshots, and export PDFs.

## Prerequisites
- Node 18+ (LTS recommended)
- Backend running and reachable (see `NEXT_PUBLIC_API_URL` below)
- Keep secrets local: use `.env.local` (gitignored) for keys; do not commit `.env` files with secrets like `OPENAI_API_KEY`.

## Setup
1) Install dependencies
```
npm install
```

2) Configure the backend URL (required)

- Create `.env.local` (or set via Vercel env) with:
```
NEXT_PUBLIC_API_URL=https://your-backend-host
```
- The backend must expose:
  - `POST /research` -> starts a task, returns `task_id`
  - `GET /research/{task_id}` -> status, steps, result
  - `POST /export_pdf` -> returns `{ url: "/reports/..." }`
  - `GET /screenshots/*` -> served screenshots
  - (optional) `POST /chat`

3) Run the app
- Dev: `npm run dev` then open http://localhost:3000
- Lint: `npm run lint`
- Production build: `npm run build` then `npm run start`
- Quick start (if backend runs on localhost:8000):
```
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Pages
- `/` Main app UI (NavBar + research form, polling, summary, sources with reliability/screenshot, PDF export)
- `/landing` Marketing/overview page (NavBar + feature grid + CTA)

## Deployment (Vercel)
- Ensure `NEXT_PUBLIC_API_URL` is set in Vercel env vars.
- This repo includes `vercel.json` pinning version 2 and `env` for local preview; override with project env settings as needed.

## Notes/Troubleshooting
- If you see “Failed while polling for results”, check the backend logs and that `/research/{task_id}` returns JSON with `steps` and `result`.
- Screenshots and PDFs are served by the backend; ensure those routes are reachable from the frontend origin.
- Update NavBar links in `app/components/NavBar.tsx` if routes change.
- Secrets: `.env.local` is gitignored—store `NEXT_PUBLIC_API_URL` there for local dev; set env vars in your hosting provider for production. Never commit `.env` with `OPENAI_API_KEY` or other secrets.

## Related backend (reference)
- FastAPI service with endpoints described above
- Uses Playwright for page fetch/screenshot, Readability.js for extraction, OpenAI for summarization
- Reliability scoring and PDF export live in the backend (not this app)
- Backend quickstart (from repo root):
  - `python3 -m venv venv && source venv/bin/activate`
  - `pip install -r requirements.txt`
  - `playwright install chromium`
  - set `OPENAI_API_KEY` (env var or `.env`, not committed)
  - run: `uvicorn main:app --reload --port 8000`
