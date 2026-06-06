# Soso-Market-Zap — CLAUDE.md

## What This Is
AI-powered signal-to-execution platform for the SoSoValue Buildathon.
SoSoValue Terminal API → Groq LLM → Trading Signals → Display/Execute via SoDEX.

## Architecture (Now Fully Vercel-Deployable)
```
apps/web              — Next.js 15 + Tailwind + shadcn/ui (VERCEL ✅)
  ├── app/api/signals/...     — REST API for signals CRUD
  ├── app/api/agents/...      — REST API for agent config
  ├── app/api/cron/analyze    — Cron job: SoSoValue → Groq → signals
  └── All frontend pages
packages/shared               — Types: Signal, AgentConfig, Market, Order + Zod schemas
packages/sosovalue-client     — SoSoValue Terminal API client
packages/sodex-client         — SoDEX orderbook API client
```

The old `services/api` (Express) and `services/signal-agent` (long-running poller) have been removed.
Everything is now in the Next.js app: API routes replace Express, cron replaces the poller.

## Dev Commands
```bash
npm run dev:web       # Single command — runs everything on :3000
```

For API keys, set them in `.env.local` of apps/web:
- `GROQ_API_KEY` — for LLM analysis
- `SOSOVALUE_API_KEY` — for SoSoValue data
- `SOURCES`, `MONITORED_CURRENCIES`, etc. (optional overrides)

## Build
```bash
npm run build         # Build all packages
npm run typecheck     # Typecheck all
```

## Key Rules
- **Zero mock data** — every value from real APIs
- **Groq is default LLM** (OpenAI-compatible at api.groq.com)
- **Build must be clean** — `next build` exits 0

## Vercel Deployment
```bash
cd apps/web
vercel deploy
```

Set env vars in Vercel dashboard or `.env.production`:
- `GROQ_API_KEY`, `SOSOVALUE_API_KEY`
- Cron runs automatically every 5 minutes (configured in vercel.json crons)

## API Endpoints (all under apps/web)
- `GET /api/health` — Health check
- `GET /api/signals` — List signals (paginated)
- `GET /api/signals/:id` — Signal detail
- `GET /api/signals/stats` — Signal statistics
- `POST /api/signals` — Push signal (from cron)
- `POST /api/signals/:id/act` — Mark signal as acted
- `GET /api/agents` — List agents
- `GET /api/agents/:id` — Agent detail
- `PUT /api/agents/:id` — Save agent config
- `GET /api/cron/analyze` — Trigger signal analysis (cron job, 5-min interval)
