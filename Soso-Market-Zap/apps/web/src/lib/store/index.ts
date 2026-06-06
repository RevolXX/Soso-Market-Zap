import fs from "node:fs";
import path from "node:path";
import type { Signal, AgentConfig } from "@market-zap/shared";

const DATA_DIR = process.env.VERCEL ? "/tmp/soso-market-zap" : path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

interface PersistedData {
  signals: Signal[];
  agents: AgentConfig[];
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(): PersistedData {
  ensureDir();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as PersistedData;
  } catch {
    return { signals: [], agents: [] };
  }
}

function writeData(data: PersistedData): void {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function addSignal(signal: Signal): void {
  const data = readData();
  data.signals.push(signal);
  writeData(data);
}

export function getSignals(limit = 50, offset = 0): { items: Signal[]; total: number } {
  const data = readData();
  const sorted = [...data.signals].reverse();
  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
  };
}

export function getSignal(id: string): Signal | undefined {
  const data = readData();
  return data.signals.find((s) => s.id === id);
}

export function updateSignal(id: string, update: Partial<Signal>): Signal | undefined {
  const data = readData();
  const idx = data.signals.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  data.signals[idx] = { ...data.signals[idx], ...update };
  writeData(data);
  return data.signals[idx];
}

export function getSignalStats() {
  const data = readData();
  const sigs = data.signals;
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

export function upsertAgent(config: AgentConfig): void {
  const data = readData();
  const idx = data.agents.findIndex((a) => a.id === config.id);
  if (idx >= 0) {
    data.agents[idx] = config;
  } else {
    data.agents.push(config);
  }
  writeData(data);
}

export function getAgent(id: string): AgentConfig | undefined {
  const data = readData();
  return data.agents.find((a) => a.id === id);
}

export function getAgents(): AgentConfig[] {
  const data = readData();
  return [...data.agents];
}
