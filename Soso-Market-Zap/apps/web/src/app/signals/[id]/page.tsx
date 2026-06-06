"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Scan } from "@phosphor-icons/react";
import { fetchSignal } from "@/lib/signals";
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

export default function SignalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      fetchSignal(id).then((s) => {
        if (s) setSignal(s);
        setLoading(false);
      });
    });
  }, [params]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/signals"
        className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to signals
      </Link>

      <div className="animate-appear mb-2 inline-flex items-center gap-2 rounded bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] font-mono font-bold text-primary tracking-widest">
        <Scan className="h-3 w-3" weight="fill" />
        Signal Detail
      </div>

      {loading ? (
        <div className="glass-panel rounded-lg border border-border/40 p-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
          <div className="h-8 w-3/4 bg-muted rounded animate-pulse mb-2" />
          <div className="h-20 w-full bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}><div className="h-10 w-full bg-muted rounded animate-pulse" /></div>
            ))}
          </div>
        </div>
      ) : !signal ? (
        <div className="glass-panel rounded-lg p-8 text-center">
          <p className="font-mono text-sm text-muted-foreground">Signal not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel rounded-lg border border-border/40 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wider border ${directionBadge(signal.direction)}`}>
                {signal.direction.toUpperCase()}
              </span>
              <span className={`text-xs font-mono font-bold tracking-wider ${severityColor(signal.severity)}`}>
                {signal.severity.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {signal.confidence}% confidence
              </span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
                {signal.sourceType.replace(/_/g, " ")}
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight mb-2">{signal.title}</h1>
            <p className="text-sm text-muted-foreground">{signal.description}</p>

            {signal.relatedAssets.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mb-1.5">Related Assets</div>
                <div className="flex flex-wrap gap-1.5">
                  {signal.relatedAssets.map((asset) => (
                    <span key={asset} className="text-xs font-mono bg-primary/5 border border-primary/10 px-2 py-0.5 rounded">
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {signal.action && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="text-[10px] font-mono text-primary tracking-wider uppercase mb-1">Action Taken</div>
                <div className="font-mono text-sm">{signal.action.type} — {signal.action.details}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {new Date(signal.action.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>Signal ID: {signal.id}</span>
            <span>·</span>
            <span>Generated: {new Date(signal.createdAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
