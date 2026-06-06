import { NextResponse } from "next/server";
import { runAnalysis, type RunAnalysisConfig } from "@/lib/signal-generator";
import { addSignal, upsertAgent } from "@/lib/store";
import type { SignalSourceType, AgentConfig } from "@market-zap/shared";

export const maxDuration = 120;

/** Resolve env-level API keys — these never come from the UI for security */
function resolveEnvKeys(): {
  soSoValueKey: string | undefined;
  llmApiKey: string | undefined;
  llmProvider: string;
  llmModel: string;
} {
  return {
    soSoValueKey: process.env.SOSOVALUE_API_KEY,
    llmApiKey:
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY,
    llmProvider: process.env.LLM_PROVIDER || "groq",
    llmModel: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
  };
}

/**
 * Build a RunAnalysisConfig by merging env keys with agent config.
 * Agent config controls: sources, monitoredCurrencyIds, minConfidence.
 * Env controls: API keys, LLM provider/model (never from UI).
 */
function buildConfig(agent?: Partial<AgentConfig>): RunAnalysisConfig | null {
  const { soSoValueKey, llmApiKey, llmProvider, llmModel } = resolveEnvKeys();

  if (!soSoValueKey || !llmApiKey) return null;

  const defaultSources: SignalSourceType[] = [
    "price_action", "news_event", "macro_event",
    "index_divergence", "sector_rotation", "etf_flow",
  ];

  return {
    soSoValueApiKey: soSoValueKey,
    llm: {
      provider: llmProvider as "groq" | "openai" | "anthropic" | "custom",
      model: llmModel,
      apiKey: llmApiKey,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.3"),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "1000", 10),
    },
    // Agent config overrides env defaults when provided
    sources: (agent?.sources && agent.sources.length > 0)
      ? agent.sources
      : defaultSources,
    monitoredCurrencyIds: (agent?.monitoredAssets && agent.monitoredAssets.length > 0)
      ? agent.monitoredAssets
      : (process.env.MONITORED_CURRENCIES || "bitcoin,ethereum,solana")
          .split(",").map((s) => s.trim()).filter(Boolean),
    minConfidence: agent?.minConfidence ?? parseInt(process.env.MIN_CONFIDENCE || "60", 10),
  };
}

/**
 * POST /api/analyze
 * Body (optional): AgentConfig — if provided, sources/minConfidence/monitoredAssets
 * from the agent override env defaults.
 */
export async function POST(req: Request) {
  let agentConfig: Partial<AgentConfig> | undefined;
  try {
    const body = await req.json();
    if (body && typeof body === "object") agentConfig = body as Partial<AgentConfig>;
  } catch {
    // no body — use env defaults
  }

  const cfg = buildConfig(agentConfig);
  if (!cfg) {
    const missing: string[] = [];
    if (!process.env.SOSOVALUE_API_KEY) missing.push("SOSOVALUE_API_KEY");
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      missing.push("GROQ_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY");
    }
    return NextResponse.json(
      { success: false, error: `Missing env vars: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const start = Date.now();
  const signals = await runAnalysis(cfg);
  for (const signal of signals) addSignal(signal);

  const durationMs = Date.now() - start;
  console.log(`[analyze] Generated ${signals.length} signals in ${durationMs}ms`);

  // Persist lastRunAt and totalSignals back to the agent store if an agent id was passed
  if (agentConfig?.id) {
    const now = new Date().toISOString();
    upsertAgent({
      ...agentConfig,
      id: agentConfig.id,
      name: agentConfig.name ?? "SoSo Signal Agent",
      enabled: agentConfig.enabled ?? true,
      sources: cfg.sources,
      monitoredAssets: cfg.monitoredCurrencyIds,
      minConfidence: cfg.minConfidence,
      pollIntervalSec: agentConfig.pollIntervalSec ?? 300,
      autoCreateMarkets: agentConfig.autoCreateMarkets ?? false,
      autoCreateThreshold: agentConfig.autoCreateThreshold ?? 85,
      llmConfig: agentConfig.llmConfig ?? { provider: "openai", model: cfg.llm.model, apiKey: "", temperature: 0.3, maxTokens: 1000 },
      lastRunAt: now,
      totalSignals: (agentConfig.totalSignals ?? 0) + signals.length,
      totalActions: agentConfig.totalActions ?? 0,
      createdAt: agentConfig.createdAt ?? now,
      updatedAt: now,
    });
  }

  return NextResponse.json({
    success: true,
    signalsGenerated: signals.length,
    durationMs,
    signals: signals.map((s) => ({
      id: s.id,
      title: s.title,
      direction: s.direction,
      confidence: s.confidence,
    })),
  });
}

/** GET /api/analyze — health-check: confirms env keys are present */
export async function GET() {
  const { soSoValueKey, llmApiKey, llmProvider, llmModel } = resolveEnvKeys();
  const configured = Boolean(soSoValueKey && llmApiKey);
  if (!configured) {
    const missing: string[] = [];
    if (!soSoValueKey) missing.push("SOSOVALUE_API_KEY");
    if (!llmApiKey) missing.push("GROQ_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY");
    return NextResponse.json({ success: false, configured: false, missing }, { status: 400 });
  }
  return NextResponse.json({ success: true, configured: true, provider: llmProvider, model: llmModel });
}
