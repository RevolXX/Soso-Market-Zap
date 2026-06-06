/**
 * Storage layer — dual-mode:
 *
 * Production (UPSTASH_REDIS_REST_URL is set):
 *   Uses Upstash Redis. Data persists across serverless invocations and
 *   is shared between all function instances. Perfect for Vercel.
 *
 * Development / no-Redis:
 *   Falls back to a local JSON file at .data/store.json.
 *   No external service needed for local work.
 */

import type { Signal, AgentConfig } from "@market-zap/shared";

// ---------------------------------------------------------------------------
// Redis backend
// ---------------------------------------------------------------------------

let _redis: import("@upstash/redis").Redis | null = null;

function getRedis(): import("@upstash/redis").Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  if (_redis) return _redis;
  // Dynamic import keeps the fs-based path tree-shakeable on the server
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  });
  return _redis;
}

// Redis key constants
const SIGNALS_KEY = "signals";
const AGENTS_KEY = "agents";

// ---------------------------------------------------------------------------
// File backend (dev fallback)
// ---------------------------------------------------------------------------

function getFileStore(): { readData: () => PersistedData; writeData: (d: PersistedData) => void } {
  // These imports are only evaluated when Redis is absent
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path") as typeof import("node:path");

  const DATA_DIR = path.join(process.cwd(), ".data");
  const DATA_FILE = path.join(DATA_DIR, "store.json");

  function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  function readData(): PersistedData {
    ensureDir();
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as PersistedData;
    } catch {
      return { signals: [], agents: [] };
    }
  }

  function writeData(data: PersistedData): void {
    ensureDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  return { readData, writeData };
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface PersistedData {
  signals: Signal[];
  agents: AgentConfig[];
}

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export async function addSignal(signal: Signal): Promise<void> {
  const redis = getRedis();
  if (redis) {
    // Store as a JSON-encoded list; lpush keeps newest first
    await redis.lpush(SIGNALS_KEY, JSON.stringify(signal));
  } else {
    const { readData, writeData } = getFileStore();
    const data = readData();
    data.signals.push(signal);
    writeData(data);
  }
}

export async function getSignals(
  limit = 50,
  offset = 0,
): Promise<{ items: Signal[]; total: number }> {
  const redis = getRedis();
  if (redis) {
    const [items, total] = await Promise.all([
      redis.lrange<Signal>(SIGNALS_KEY, offset, offset + limit - 1),
      redis.llen(SIGNALS_KEY),
    ]);
    return { items, total };
  }
  const { readData } = getFileStore();
  const data = readData();
  const sorted = [...data.signals].reverse();
  return { items: sorted.slice(offset, offset + limit), total: sorted.length };
}

export async function getSignal(id: string): Promise<Signal | undefined> {
  const redis = getRedis();
  if (redis) {
    // Scan the list for the matching id (small dataset — acceptable)
    const total = await redis.llen(SIGNALS_KEY);
    if (total === 0) return undefined;
    const items = await redis.lrange<Signal>(SIGNALS_KEY, 0, total - 1);
    return items.find((s) => s.id === id);
  }
  const { readData } = getFileStore();
  return readData().signals.find((s) => s.id === id);
}

export async function updateSignal(
  id: string,
  update: Partial<Signal>,
): Promise<Signal | undefined> {
  const redis = getRedis();
  if (redis) {
    const total = await redis.llen(SIGNALS_KEY);
    if (total === 0) return undefined;
    const raw = await redis.lrange<Signal>(SIGNALS_KEY, 0, total - 1);
    const idx = raw.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    const updated = { ...raw[idx], ...update };
    await redis.lset(SIGNALS_KEY, idx, JSON.stringify(updated));
    return updated;
  }
  const { readData, writeData } = getFileStore();
  const data = readData();
  const idx = data.signals.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  data.signals[idx] = { ...data.signals[idx], ...update };
  writeData(data);
  return data.signals[idx];
}

export async function getSignalStats() {
  const redis = getRedis();
  let sigs: Signal[];
  if (redis) {
    const total = await redis.llen(SIGNALS_KEY);
    sigs = total > 0 ? await redis.lrange<Signal>(SIGNALS_KEY, 0, total - 1) : [];
  } else {
    const { readData } = getFileStore();
    sigs = readData().signals;
  }

  const stats = {
    totalSignals: sigs.length,
    byDirection: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    avgConfidence: 0,
  };
  for (const s of sigs) {
    stats.byDirection[s.direction] = (stats.byDirection[s.direction] ?? 0) + 1;
    stats.bySeverity[s.severity] = (stats.bySeverity[s.severity] ?? 0) + 1;
    stats.bySource[s.sourceType] = (stats.bySource[s.sourceType] ?? 0) + 1;
  }
  stats.avgConfidence =
    sigs.length > 0
      ? sigs.reduce((sum, s) => sum + s.confidence, 0) / sigs.length
      : 0;
  return stats;
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export async function upsertAgent(config: AgentConfig): Promise<void> {
  const redis = getRedis();
  if (redis) {
    // Store each agent under its own key for O(1) access
    await redis.hset(AGENTS_KEY, { [config.id]: JSON.stringify(config) });
  } else {
    const { readData, writeData } = getFileStore();
    const data = readData();
    const idx = data.agents.findIndex((a) => a.id === config.id);
    if (idx >= 0) data.agents[idx] = config;
    else data.agents.push(config);
    writeData(data);
  }
}

export async function getAgent(id: string): Promise<AgentConfig | undefined> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.hget<string>(AGENTS_KEY, id);
    if (!raw) return undefined;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as AgentConfig;
  }
  const { readData } = getFileStore();
  return readData().agents.find((a) => a.id === id);
}

export async function getAgents(): Promise<AgentConfig[]> {
  const redis = getRedis();
  if (redis) {
    const all = await redis.hgetall<Record<string, string>>(AGENTS_KEY);
    if (!all) return [];
    return Object.values(all).map((v) =>
      (typeof v === "string" ? JSON.parse(v) : v) as AgentConfig,
    );
  }
  const { readData } = getFileStore();
  return [...readData().agents];
}
