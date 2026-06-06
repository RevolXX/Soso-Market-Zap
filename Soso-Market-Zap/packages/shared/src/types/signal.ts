import { z } from "zod";

// -----------------------------------------------------------------------
// Signal Source — where the signal came from
// -----------------------------------------------------------------------

export const SignalSourceType = {
  PriceAction: "price_action",
  NewsEvent: "news_event",
  MacroEvent: "macro_event",
  IndexDivergence: "index_divergence",
  SectorRotation: "sector_rotation",
  WhaleActivity: "whale_activity",
  TechnicalPattern: "technical_pattern",
  Fundraising: "fundraising",
  ETF: "etf_flow",
  Custom: "custom",
} as const;

export type SignalSourceType =
  (typeof SignalSourceType)[keyof typeof SignalSourceType];

export const SignalSourceTypeSchema = z.enum([
  "price_action",
  "news_event",
  "macro_event",
  "index_divergence",
  "sector_rotation",
  "whale_activity",
  "technical_pattern",
  "fundraising",
  "etf_flow",
  "custom",
]);

// -----------------------------------------------------------------------
// Signal Severity / Confidence
// -----------------------------------------------------------------------

export const SignalSeverity = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
} as const;

export type SignalSeverity = (typeof SignalSeverity)[keyof typeof SignalSeverity];

export const SignalSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const SignalDirection = {
  Bullish: "bullish",
  Bearish: "bearish",
  Neutral: "neutral",
} as const;

export type SignalDirection =
  (typeof SignalDirection)[keyof typeof SignalDirection];

export const SignalDirectionSchema = z.enum(["bullish", "bearish", "neutral"]);

// -----------------------------------------------------------------------
// Signal
// -----------------------------------------------------------------------

export interface Signal {
  /** Unique signal ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description and reasoning */
  description: string;
  /** Source type that generated this signal */
  sourceType: SignalSourceType;
  /** Direction — bullish, bearish, or neutral */
  direction: SignalDirection;
  /** Confidence level */
  severity: SignalSeverity;
  /** Numeric confidence score 0-100 */
  confidence: number;
  /** The asset(s) this signal relates to (e.g. ["BTC", "ETH"]) */
  relatedAssets: string[];
  /** The currency IDs from SoSoValue API */
  relatedCurrencyIds: string[];
  /** Current price at signal generation */
  currentPrice: number;
  /** Target price if applicable */
  targetPrice?: number | null;
  /** Stop-loss price if applicable */
  stopLoss?: number | null;
  /** Timeframe for the signal (e.g. "24h", "7d", "1m") */
  timeframe: string;
  /** SoSoValue data that backs this signal (freeform metadata) */
  evidence: Record<string, unknown>;
  /** ISO timestamp when signal was generated */
  createdAt: string;
  /** Whether the signal has been acted upon */
  acted: boolean;
  /** If acted, what action was taken */
  action?: SignalAction | null;
  /** Expiry timestamp */
  expiresAt: string;
  /** Market ID if a prediction market was created from this signal */
  marketId?: string | null;
}

export const SignalSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  sourceType: SignalSourceTypeSchema,
  direction: SignalDirectionSchema,
  severity: SignalSeveritySchema,
  confidence: z.number().min(0).max(100),
  relatedAssets: z.array(z.string()),
  relatedCurrencyIds: z.array(z.string()),
  currentPrice: z.number(),
  targetPrice: z.number().nullable().optional(),
  stopLoss: z.number().nullable().optional(),
  timeframe: z.string(),
  evidence: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  acted: z.boolean(),
  action: z.object({
    type: z.enum(["buy", "sell", "hold", "create_market"]),
    details: z.string(),
    timestamp: z.string().datetime(),
  }).nullable().optional(),
  expiresAt: z.string().datetime(),
  marketId: z.string().nullable().optional(),
});

// -----------------------------------------------------------------------
// Signal Action — what happened as a result of the signal
// -----------------------------------------------------------------------

export interface SignalAction {
  type: "buy" | "sell" | "hold" | "create_market";
  details: string;
  timestamp: string;
}

// -----------------------------------------------------------------------
// Agent Configuration
// -----------------------------------------------------------------------

export interface AgentConfig {
  /** Unique agent ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Whether the agent is active */
  enabled: boolean;
  /** Which SoSoValue data sources to poll */
  sources: SignalSourceType[];
  /** Assets/currencies to monitor (empty = all) */
  monitoredAssets: string[];
  /** Minimum confidence threshold to generate a signal (0-100) */
  minConfidence: number;
  /** Interval in seconds between analysis runs */
  pollIntervalSec: number;
  /** Whether to auto-create prediction markets for high-confidence signals */
  autoCreateMarkets: boolean;
  /** Minimum confidence for auto-creating a market */
  autoCreateThreshold: number;
  /** LLM model config */
  llmConfig: {
    provider: "openai" | "anthropic" | "groq" | "custom";
    model: string;
    apiKey: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };
  /** When the agent was last run */
  lastRunAt?: string | null;
  /** Total signals generated */
  totalSignals: number;
  /** Total signals acted upon */
  totalActions: number;
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt: string;
}

export const AgentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  sources: z.array(SignalSourceTypeSchema),
  monitoredAssets: z.array(z.string()),
  minConfidence: z.number().min(0).max(100),
  pollIntervalSec: z.number().positive(),
  autoCreateMarkets: z.boolean(),
  autoCreateThreshold: z.number().min(0).max(100),
  llmConfig: z.object({
    provider: z.enum(["openai", "anthropic", "groq", "custom"]),
    model: z.string(),
    apiKey: z.string(),
    temperature: z.number(),
    maxTokens: z.number().positive(),
    systemPrompt: z.string().optional(),
  }),
  lastRunAt: z.string().datetime().nullable().optional(),
  totalSignals: z.number().int().nonnegative(),
  totalActions: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// -----------------------------------------------------------------------
// Signal Feed — aggregated view for dashboard
// -----------------------------------------------------------------------

export interface SignalFeed {
  signals: Signal[];
  total: number;
  unread: number;
  latestGenerated: string | null;
}

// -----------------------------------------------------------------------
// Agent Stats
// -----------------------------------------------------------------------

export interface AgentStats {
  totalSignals: number;
  totalActions: number;
  signalsByDirection: Record<string, number>;
  signalsBySeverity: Record<string, number>;
  signalsBySource: Record<string, number>;
  accuracy: number;
  avgConfidence: number;
  topPerformingAssets: Array<{ asset: string; signals: number; actions: number }>;
  uptime: number;
  lastRunDuration: number;
}
