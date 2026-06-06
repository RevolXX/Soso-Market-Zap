"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Scan, Play, Stop, Gear, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  fetchAgents,
  fetchSignalStats,
  saveAgentConfig,
  checkAnalyzeConfig,
  triggerAnalysis,
} from "@/lib/signals";
import type { AgentConfig, SignalSourceType } from "@market-zap/shared";

const defaultConfig: AgentConfig = {
  id: "agent-1",
  name: "SoSo Signal Agent",
  enabled: false,
  sources: ["price_action", "news_event", "macro_event", "index_divergence", "sector_rotation", "etf_flow"],
  monitoredAssets: ["bitcoin", "ethereum"],
  minConfidence: 60,
  pollIntervalSec: 300,
  autoCreateMarkets: false,
  autoCreateThreshold: 85,
  llmConfig: {
    provider: "groq",
    model: "mixtral-8x7b-32768",
    apiKey: "",
    temperature: 0.3,
    maxTokens: 1000,
  },
  totalSignals: 0,
  totalActions: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function AgentPage() {
  const [config, setConfig] = useState<AgentConfig>(defaultConfig);
  const [stats, setStats] = useState<{
    totalSignals: number;
    byDirection: Record<string, number>;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    avgConfidence: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [envConfigured, setEnvConfigured] = useState<boolean | null>(null);
  const [envInfo, setEnvInfo] = useState<{ provider?: string; model?: string; missing?: string[] } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
    checkEnv();
  }, []);

  async function checkEnv() {
    const result = await checkAnalyzeConfig();
    if (result) {
      setEnvConfigured(result.configured);
      setEnvInfo(result);
    }
  }

  async function loadConfig() {
    const data = await fetchAgents();
    if (data?.agents?.[0]) {
      setConfig(data.agents[0]);
    }
  }

  async function loadStats() {
    const data = await fetchSignalStats();
    if (data) setStats(data);
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await saveAgentConfig(config);
      setLastResult("Configuration saved");
    } finally {
      setSaving(false);
    }
  }

  const runAnalysis = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      // Pass the current agent config so sources, minConfidence, monitoredAssets
      // are actually used by the analyze route
      const result = await triggerAnalysis(config);
      setLastRun(new Date().toLocaleTimeString());
      if (result?.success) {
        const label = `Generated ${result.signalsGenerated ?? 0} signal(s)${result.durationMs ? ` in ${(result.durationMs / 1000).toFixed(1)}s` : ""}`;
        setLastResult(label);
        loadStats();
      } else {
        setLastResult(`Error: ${result?.error ?? "Unknown error"}`);
      }
    } catch {
      setLastResult("Failed to reach server");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, config]);

  function startAgent() {
    setRunning(true);
    setConfig((c) => ({ ...c, enabled: true }));
    // Run immediately then on interval
    runAnalysis();
    pollRef.current = setInterval(runAnalysis, config.pollIntervalSec * 1000);
  }

  function stopAgent() {
    setRunning(false);
    setConfig((c) => ({ ...c, enabled: false }));
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const sourceLabels: Partial<Record<SignalSourceType, string>> = {
    price_action: "Price Action",
    news_event: "News & Social Sentiment",
    macro_event: "Macroeconomic Events",
    index_divergence: "SoSoValue Index Divergence",
    sector_rotation: "Sector Rotation",
    etf_flow: "ETF Flows",
    fundraising: "Fundraising Activity",
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <div className="animate-appear mb-2 inline-flex items-center gap-2 rounded bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] font-mono font-bold text-primary tracking-widest">
          <Scan className="h-3 w-3" weight="fill" />
          Agent Configuration
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Signal Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the AI agent that analyzes SoSoValue data and generates trading signals.
        </p>
      </div>

      {/* Env status banner */}
      {envConfigured !== null && (
        <div className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
          envConfigured
            ? "border-green-500/30 bg-green-500/5 text-green-400"
            : "border-red-500/30 bg-red-500/5 text-red-400"
        }`}>
          {envConfigured
            ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" weight="fill" />
            : <WarningCircle className="h-4 w-4 mt-0.5 shrink-0" weight="fill" />}
          <div className="font-mono text-xs">
            {envConfigured
              ? `API keys detected. Using ${envInfo?.provider ?? "groq"} / ${envInfo?.model ?? "mixtral-8x7b-32768"} from .env.local`
              : `Missing env vars: ${envInfo?.missing?.join(", ") ?? "SOSOVALUE_API_KEY or LLM key"}. Add them to .env.local and restart the dev server.`}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status card */}
        <div className="glass-panel rounded-lg border border-border/40 p-5">
          <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3">Status</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${running ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
              <span className="font-mono text-sm">
                {analyzing ? "Analyzing…" : running ? "Running" : "Stopped"}
              </span>
            </div>
            <Button
              size="sm"
              variant={running ? "destructive" : "default"}
              disabled={envConfigured === false}
              onClick={running ? stopAgent : startAgent}
            >
              {running ? <Stop className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              {running ? "Stop" : "Start"}
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Signals</span>
              <span className="font-mono font-semibold">{stats?.totalSignals ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Confidence</span>
              <span className="font-mono font-semibold">{stats ? `${stats.avgConfidence.toFixed(0)}%` : "0%"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Poll Interval</span>
              <span className="font-mono font-semibold">{config.pollIntervalSec}s</span>
            </div>
            {lastRun && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Run</span>
                <span className="font-mono font-semibold text-xs">{lastRun}</span>
              </div>
            )}
            {lastResult && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Result</span>
                <span className={`font-mono font-semibold text-xs ${lastResult.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                  {lastResult}
                </span>
              </div>
            )}
          </div>

          {/* Manual trigger */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <Button
              size="sm"
              variant="outline"
              className="w-full font-mono text-xs"
              disabled={analyzing || envConfigured === false}
              onClick={runAnalysis}
            >
              {analyzing ? "Analyzing…" : "Run Analysis Now"}
            </Button>
          </div>
        </div>

        {/* Sources card */}
        <div className="glass-panel rounded-lg border border-border/40 p-5">
          <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3">Data Sources</h2>
          <div className="space-y-2">
            {(Object.keys(sourceLabels) as SignalSourceType[]).map((key) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.sources.includes(key)}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      sources: e.target.checked
                        ? [...config.sources, key]
                        : config.sources.filter((s) => s !== key),
                    });
                  }}
                  className="rounded border-border"
                />
                <span className="font-mono text-xs">{sourceLabels[key]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Thresholds card */}
        <div className="glass-panel rounded-lg border border-border/40 p-5">
          <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3">Thresholds</h2>
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-xs font-mono mb-1">
                <span>Min Confidence</span>
                <span className="text-primary">{config.minConfidence}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.minConfidence}
                onChange={(e) => setConfig({ ...config, minConfidence: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-mono mb-1">
                <span>Poll Interval (seconds)</span>
                <span className="text-primary">{config.pollIntervalSec}s</span>
              </label>
              <input
                type="range"
                min={60}
                max={3600}
                step={60}
                value={config.pollIntervalSec}
                onChange={(e) => setConfig({ ...config, pollIntervalSec: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCreateMarkets}
                onChange={(e) => setConfig({ ...config, autoCreateMarkets: e.target.checked })}
                className="rounded border-border"
              />
              <span className="font-mono text-xs">Auto-create prediction markets for high-confidence signals</span>
            </label>
            {config.autoCreateMarkets && (
              <div>
                <label className="flex justify-between text-xs font-mono mb-1">
                  <span>Auto-create threshold</span>
                  <span className="text-primary">{config.autoCreateThreshold}%</span>
                </label>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={config.autoCreateThreshold}
                  onChange={(e) => setConfig({ ...config, autoCreateThreshold: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* LLM info card (read-only — keys come from .env.local) */}
        <div className="glass-panel rounded-lg border border-border/40 p-5">
          <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3">
            <Gear className="h-3 w-3 inline mr-1" />
            LLM Configuration
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            LLM provider and API keys are read from <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code>.
            Edit that file to change providers or rotate keys.
          </p>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span>{envInfo?.provider ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span>{envInfo?.model ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Keys set</span>
              <span className={envConfigured ? "text-green-400" : "text-red-400"}>
                {envConfigured === null ? "Checking…" : envConfigured ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Save persists your sources, thresholds, and poll interval so they reload on next visit.
        </p>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
