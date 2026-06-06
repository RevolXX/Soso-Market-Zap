# Soso-Market-Zap

**AI-powered signal-to-execution platform** — Built for the SoSoValue Buildathon.

SoSoValue data → Groq LLM analysis → Trading signals → Display & Execute

**Now fully deployable on Vercel** — no separate servers needed.

## Architecture

```
apps/web (Next.js 15 — Vercel-deployable)
├── API Routes            ← signals CRUD, agent config, cron analysis
├── Cron (every 5 min)    ← polls SoSoValue, analyzes via Groq, stores signals
├── Signal Dashboard      ← stats, signal list, signal detail
└── Agent Configuration   ← LLM provider, sources, thresholds

packages/shared           ← Types (Signal, AgentConfig) + Zod schemas
packages/sosovalue-client ← SoSoValue Terminal API client
packages/sodex-client     ← SoDEX orderbook API client
```

### Data Flow

```
SoSoValue Terminal API
  ├─ Currencies, Indices, News, Macro, ETF, Sectors
          │
          ▼
   Cron (/api/cron/analyze) — every 5 min via Vercel Cron
     └─ Groq LLM (Mixtral/Llama)
          │  analyzes data + generates signals
          ▼
   JSON file store (.data/store.json)
     └─ Persisted signals + agent config
          │
          ▼
   Frontend (signal dashboard)
     ├─ Stats overview
     ├─ Signal list with confidence/severity/direction
     ├─ Signal detail with reasoning & evidence
     └─ Agent configuration UI
```

## SoSoValue Buildathon Context

- **Wave**: Wave 3 (Jun 14–25) or Wave 2 evaluation (Jun 4–13)
- **Category**: Signal-to-Execution Agent
- **Integrations**: SoSoValue API ✅, SoDEX API (client) ✅, AI/Groq ✅

## Quick Start

```bash
npm install

# Set API keys in apps/web/.env.local:
# GROQ_API_KEY=gsk_...
# SOSOVALUE_API_KEY=xxx

# Run everything on a single dev server:
npm run dev:web
# → http://localhost:3000
```

### Environment Variables (apps/web)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes* | — | Groq API key for LLM analysis |
| `SOSOVALUE_API_KEY` | Yes | — | SoSoValue Terminal API key |
| `LLM_MODEL` | No | `mixtral-8x7b-32768` | Groq model |
| `SOURCES` | No | `price_action,news_event,macro_event,index_divergence,sector_rotation,etf_flow` | Data sources to analyze |
| `MIN_CONFIDENCE` | No | `60` | Minimum confidence threshold |
| `MONITORED_CURRENCIES` | No | `bitcoin,ethereum,solana` | Currencies to monitor |

*Or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`

## Deploy to Vercel

```bash
npx vercel deploy

# Set env vars in Vercel dashboard:
# GROQ_API_KEY, SOSOVALUE_API_KEY
```

The cron job runs automatically every 5 minutes. No other servers needed.

## Packages

| Package | Description |
|---|---|
| `packages/sosovalue-client` | Full TypeScript client for SoSoValue Terminal API (currencies, indices, ETF, news, macro, stocks, analysis) |
| `packages/sodex-client` | SoDEX orderbook trading API client with EIP-712 signing |
| `packages/shared` | Shared types: Signal, AgentConfig, Market, Order, Portfolio + Zod schemas |

## Judging Criteria Alignment

| Criterion | Weight | How We Address It |
|---|---|---|
| User Value & Impact | 30% | Clear signal-to-execution flow; helps users discover opportunities |
| Functionality & Demo | 25% | Working signal dashboard with live data, agent config, signal details |
| Logic & Workflow | 20% | Complete pipeline: SoSoValue data → LLM analysis → signal → action |
| API Integration | 15% | Deep SoSoValue API integration (7+ data modules) + SoDEX client |
| UX & Clarity | 10% | Clean terminal-style UI, real-time stats, intuitive agent config |
