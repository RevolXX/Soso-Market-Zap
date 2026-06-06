import type { Signal, AgentConfig } from "@market-zap/shared";

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

export async function fetchSignals(): Promise<{ items: Signal[]; total: number } | null> {
  return api<{ items: Signal[]; total: number }>("/api/signals");
}

export async function fetchSignal(id: string): Promise<Signal | null> {
  return api<Signal>(`/api/signals/${encodeURIComponent(id)}`);
}

export async function fetchSignalStats(): Promise<{
  totalSignals: number;
  byDirection: Record<string, number>;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  avgConfidence: number;
} | null> {
  return api("/api/signals/stats");
}

export async function fetchAgents(): Promise<{ agents: AgentConfig[] } | null> {
  return api<{ agents: AgentConfig[] }>("/api/agents");
}

export async function fetchAgent(id: string): Promise<AgentConfig | null> {
  return api<AgentConfig>(`/api/agents/${encodeURIComponent(id)}`);
}

export async function saveAgentConfig(config: AgentConfig): Promise<AgentConfig | null> {
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(config.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as AgentConfig;
  } catch {
    return null;
  }
}

export async function checkAnalyzeConfig(): Promise<{
  configured: boolean;
  provider?: string;
  model?: string;
  missing?: string[];
} | null> {
  try {
    const res = await fetch("/api/analyze");
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

export async function triggerAnalysis(agentConfig?: AgentConfig): Promise<{
  success: boolean;
  signalsGenerated?: number;
  durationMs?: number;
  error?: string;
} | null> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentConfig ?? {}),
    });
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}
