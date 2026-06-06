"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Scan, ArrowRight } from "@phosphor-icons/react";
import { fetchSignals, fetchSignalStats } from "@/lib/signals";
import type { Signal } from "@market-zap/shared";

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "text-red-500";
    case "high": return "text-orange-500";
    case "medium": return "text-yellow-500";
    default: return "text-muted-foreground";
  }
}

function directionBadge(direction: string): string {
  switch (direction) {
    case "bullish": return "bg-green-500/10 text-green-500 border-green-500/30";
    case "bearish": return "bg-red-500/10 text-red-500 border-red-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<{
    totalSignals: number;
    byDirection: Record<string, number>;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    avgConfidence: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSignals().then((d) => setSignals(d?.items ?? [])),
      fetchSignalStats().then(setStats),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <div className="animate-appear mb-2 inline-flex items-center gap-2 rounded bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] font-mono font-bold text-primary tracking-widest">
          <Scan className="h-3 w-3" weight="fill" />
          SoSoValue Signal Engine
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Signals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated trading signals powered by SoSoValue market data, news, and analytics.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="font-mono text-xl font-bold text-primary">{stats?.totalSignals ?? 0}</div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Total</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="font-mono text-xl font-bold text-green-500">{stats?.byDirection?.bullish ?? 0}</div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Bullish</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="font-mono text-xl font-bold text-red-500">{stats?.byDirection?.bearish ?? 0}</div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Bearish</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="font-mono text-xl font-bold text-yellow-500">{stats?.bySeverity?.critical ?? 0}</div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Critical</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="font-mono text-xl font-bold">{stats ? `${stats.avgConfidence.toFixed(0)}%` : "0%"}</div>
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Avg Conf</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {loading ? "Loading..." : `Latest Signals (${signals.length})`}
        </h2>
        <Link href="/agent" className="text-xs font-mono text-primary hover:underline">
          Configure Agent →
        </Link>
      </div>

      <div className="space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-lg border border-border/40 p-4 animate-pulse">
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-4 w-3/4 bg-muted rounded mb-1" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        ))}
        {!loading && signals.map((signal) => (
          <Link
            key={signal.id}
            href={`/signals/${signal.id}`}
            className="glass-panel group flex items-center justify-between rounded-lg border border-border/40 p-4 transition-all hover:border-primary/30"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${directionBadge(signal.direction)}`}>
                  {signal.direction.toUpperCase()}
                </span>
                <span className={`text-[10px] font-mono font-bold tracking-wider ${severityColor(signal.severity)}`}>
                  {signal.severity.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {signal.confidence}% confidence
                </span>
              </div>
              <h3 className="font-mono text-sm font-semibold truncate">{signal.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{signal.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {signal.relatedAssets.map((asset) => (
                  <span key={asset} className="text-[10px] font-mono bg-primary/5 px-1.5 py-0.5 rounded">
                    {asset}
                  </span>
                ))}
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {signal.sourceType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 ml-3" />
          </Link>
        ))}
        {!loading && signals.length === 0 && (
          <div className="glass-panel rounded-lg p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              No signals yet. Set up your API keys and start the signal agent to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
