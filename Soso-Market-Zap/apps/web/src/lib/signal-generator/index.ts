import { SoSoValueClient } from "@market-zap/sosovalue-client";
import type { Signal, SignalSourceType } from "@market-zap/shared";
import { SignalDirection, SignalSeverity } from "@market-zap/shared";
import { SignalLLM, type LLMConfig, type LLMAnalysisResult } from "./llm";
import { analyzers, type AnalyzerFunction, type AnalyzerResult } from "./analyzers";
import { createId } from "./utils";

export interface RunAnalysisConfig {
  soSoValueApiKey: string;
  llm: LLMConfig;
  sources: SignalSourceType[];
  monitoredCurrencyIds: string[];
  minConfidence: number;
}

export async function runAnalysis(config: RunAnalysisConfig): Promise<Signal[]> {
  const client = new SoSoValueClient({ apiKey: config.soSoValueApiKey });
  const llm = new SignalLLM(config.llm);
  const signals: Signal[] = [];

  for (const source of config.sources) {
    try {
      const analyzer: AnalyzerFunction | undefined =
        source === "price_action"
          ? async (c) => {
              const { analyzeMarketSnapshots } = await import("./analyzers");
              return analyzeMarketSnapshots(c, config.monitoredCurrencyIds);
            }
          : analyzers[source];

      if (!analyzer) continue;

      const results = await analyzer(client);
      console.log(`[signal-generator] ${source}: ${results.length} data points`);

      for (const result of results) {
        try {
          const analysis = await llm.analyze(result);

          if (analysis.confidence >= config.minConfidence) {
            const signal = buildSignal(analysis, result, config.monitoredCurrencyIds);
            signals.push(signal);
          } else {
            console.log(`[signal-generator] ${result.sourceType} — "${analysis.title}" confidence ${analysis.confidence}% below threshold ${config.minConfidence}%`);
          }
        } catch (err) {
          console.error(`[signal-generator] LLM analysis failed for ${source}:`, err);
        }
      }
    } catch (err) {
      console.error(`[signal-generator] Analyzer failed for ${source}:`, err);
    }
  }

  return signals;
}

function parseTimeframeMs(timeframe: string): number {
  const unit = timeframe.slice(-1);
  const value = parseInt(timeframe.slice(0, -1), 10);
  switch (unit) {
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    case "m": return value * 30 * 24 * 60 * 60 * 1000;
    case "w": return value * 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function buildSignal(
  analysis: LLMAnalysisResult,
  analyzerResult: AnalyzerResult,
  monitoredCurrencyIds: string[],
): Signal {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + parseTimeframeMs(analysis.timeframe));

  return {
    id: createId(),
    title: analysis.title,
    description: analysis.reasoning,
    sourceType: analyzerResult.sourceType,
    direction: analysis.direction as SignalDirection,
    severity: analysis.severity as SignalSeverity,
    confidence: analysis.confidence,
    relatedAssets: analysis.relatedAssets,
    relatedCurrencyIds: monitoredCurrencyIds,
    currentPrice: 0,
    targetPrice: analysis.targetPrice,
    stopLoss: analysis.stopLoss,
    timeframe: analysis.timeframe,
    evidence: { dataType: analyzerResult.dataType, rawData: analyzerResult.data },
    createdAt: now.toISOString(),
    acted: false,
    action: null,
    expiresAt: expiresAt.toISOString(),
    marketId: null,
  };
}
