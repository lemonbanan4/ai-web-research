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
`npm install`

2) Backend URL (required)  
- Create `.env.local` (gitignored) with:  
  `NEXT_PUBLIC_API_URL=https://your-backend-host`  
- Backend should expose: `POST /research`, `GET /research/{task_id}`, `POST /export_pdf` (returns `{ url: "/reports/..." }`), `GET /screenshots/*`, and optional `POST /chat`.

3) Run the app  
- Dev: `npm run dev` then open http://localhost:3000  
- Lint: `npm run lint`  
- Prod build: `npm run build` then `npm run start`  
- Quick start (local backend on :8000):  
  `NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev`

## Pages
- `/` Main app UI (NavBar + research form, polling, summary, sources with reliability/screenshot, PDF export)
- `/landing` Marketing/overview page (NavBar + feature grid + CTA)

## Deployment (Vercel)
- Ensure `NEXT_PUBLIC_API_URL` is set in Vercel env vars.
- `vercel.json` pins version 2 and includes an env placeholder; override with project env settings.

## Notes/Troubleshooting
- “Failed while polling for results”: check backend logs; ensure `/research/{task_id}` returns JSON with `steps` and `result`.
- Screenshots/PDFs are served by the backend; routes must be reachable from the frontend origin.
- Update NavBar links in `app/components/NavBar.tsx` if routes change.
- Secrets: `.env.local` is gitignored—keep `NEXT_PUBLIC_API_URL` there locally; set env vars in hosting for production. Never commit `.env` with `OPENAI_API_KEY` or other secrets.

## Related backend (reference)
- FastAPI service with endpoints above
- Uses Playwright (fetch/screenshot), Readability.js (extraction), OpenAI (summaries), and reliability scoring/PDF export on the backend.
- Backend quickstart (from repo root):
  - `python3 -m venv venv && source venv/bin/activate`
  - `pip install -r requirements.txt`
  - `playwright install chromium`
  - set `OPENAI_API_KEY` (env var or `.env`, not committed)
  - run: `uvicorn main:app --reload --port 8000`
