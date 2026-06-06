import { NextResponse } from "next/server";
import { runAnalysis, type RunAnalysisConfig } from "@/lib/signal-generator";
import { addSignal } from "@/lib/store";
import type { SignalSourceType } from "@market-zap/shared";

export const maxDuration = 120;

const isDev = process.env.NODE_ENV === "development";

function buildConfig(): RunAnalysisConfig | null {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const soSoValueKey = process.env.SOSOVALUE_API_KEY;

  if (!soSoValueKey) return null;

  const llmProvider = process.env.LLM_PROVIDER || "groq";
  const apiKey = groqKey || openaiKey || anthropicKey;
  if (!apiKey) return null;

  const sources = (process.env.SOURCES || "price_action,news_event,macro_event,index_divergence,sector_rotation,etf_flow")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as SignalSourceType[];

  const monitoredCurrencies = (process.env.MONITORED_CURRENCIES || "bitcoin,ethereum,solana")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    soSoValueApiKey: soSoValueKey,
    llm: {
      provider: llmProvider as "groq" | "openai" | "anthropic" | "custom",
      model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
      apiKey,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.3"),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "1000", 10),
    },
    sources,
    monitoredCurrencyIds: monitoredCurrencies,
    minConfidence: parseInt(process.env.MIN_CONFIDENCE || "60", 10),
  };
}

// In dev mode, auto-poll every 5 minutes like the old signal-agent.
// We defer config resolution to poll-time so env vars loaded after module
// initialisation (e.g. Next.js .env.local) are always picked up.
if (isDev) {
  console.log("[cron/analyze] Dev mode auto-polling every 300s");
  const poll = async () => {
    const cfg = buildConfig();
    if (!cfg) {
      console.warn("[cron/analyze] Poll skipped — missing env vars (SOSOVALUE_API_KEY or LLM key)");
      return;
    }
    try {
      const sigs = await runAnalysis(cfg);
      for (const s of sigs) addSignal(s);
      if (sigs.length > 0) console.log(`[cron/analyze] Generated ${sigs.length} signals`);
    } catch (err) {
      console.error("[cron/analyze] Poll error:", err);
    }
  };
  poll();
  setInterval(poll, 300_000);
}

export async function GET() {
  const cfg = buildConfig();
  if (!cfg) {
    const missing: string[] = [];
    if (!process.env.SOSOVALUE_API_KEY) missing.push("SOSOVALUE_API_KEY");
    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      missing.push("GROQ_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY");
    }
    return NextResponse.json({ error: `Missing: ${missing.join(", ")}` }, { status: 400 });
  }

  const start = Date.now();
  const signals = await runAnalysis(cfg);
  for (const signal of signals) addSignal(signal);
  console.log(`[cron/analyze] Generated ${signals.length} signals in ${Date.now() - start}ms`);

  return NextResponse.json({
    success: true,
    signalsGenerated: signals.length,
    signals: signals.map((s) => ({ id: s.id, title: s.title, direction: s.direction, confidence: s.confidence })),
  });
}
