"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { fetchSignalStats } from "@/lib/signals";

const features = [
  {
    title: "AI Signal Engine",
    description: "LLM-powered analysis of SoSoValue market data, news, indices, and macro events to generate actionable trading signals.",
  },
  {
    title: "SoSoValue Integration",
    description: "Real-time access to 7+ SoSoValue Terminal API modules: currencies, indices, ETF flows, macro events, news, and crypto stocks.",
  },
  {
    title: "SoDEX Execution",
    description: "Execute signals directly on SoDEX — the high-performance on-chain orderbook built on ValueChain L1.",
  },
  {
    title: "Groq-Powered LLM",
    description: "Mixtral 8x7B and Llama models via Groq API analyze market conditions and generate confidence-scored signals in real time.",
  },
];

export default function HomePage() {
  const [stats, setStats] = useState<{
    totalSignals: number;
    byDirection: Record<string, number>;
    bySeverity: Record<string, number>;
    bySource: Record<string, number>;
    avgConfidence: number;
  } | null>(null);

  useEffect(() => {
    fetchSignalStats().then(setStats);
  }, []);

  return (
    <div className="flex flex-col">
      <section className="container mx-auto max-w-screen-xl px-4 pt-16 pb-14 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-2xl">
          <div className="animate-appear mb-4 inline-flex items-center gap-2 rounded bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] font-mono font-bold text-primary tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-primary blink" />
            SoSoValue Buildathon — Signal-to-Execution Platform
          </div>
          <h1 className="animate-appear font-heading text-4xl font-bold tracking-tight leading-none md:text-6xl">
            AI signals meet
            <br />
            <span className="text-primary text-glow-amber">on-chain execution.</span>
          </h1>
          <p className="mt-6 animate-appear max-w-[50ch] text-base leading-relaxed text-muted-foreground [animation-delay:100ms] sm:text-lg">
            AI-generated trading signals powered by SoSoValue market data. Execute on SoDEX or your preferred DEX.
          </p>
          <div className="mt-8 flex animate-appear flex-col gap-3 [animation-delay:200ms] sm:flex-row sm:items-center">
            <Link href="/signals" prefetch>
              <Button size="xl" className="w-full sm:w-auto font-mono tracking-wider">
                Explore Signals
              </Button>
            </Link>
            <Link href="/agent" prefetch>
              <Button variant="outline" size="xl" className="w-full sm:w-auto font-mono tracking-wider">
                Configure Agent
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-4 sm:gap-6">
          <div className="glass-panel flex flex-col items-center justify-center rounded-lg px-6 py-5 min-w-[120px] sm:min-w-[140px]">
            <span className="font-mono text-2xl font-bold text-primary text-glow-amber sm:text-3xl">
              {stats?.totalSignals ?? 0}
            </span>
            <span className="mt-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 uppercase">Signals</span>
          </div>
          <div className="glass-panel flex flex-col items-center justify-center rounded-lg px-6 py-5 min-w-[120px] sm:min-w-[140px]">
            <span className="font-mono text-2xl font-bold text-green-500 sm:text-3xl">
              {stats?.byDirection?.bullish ?? 0}
            </span>
            <span className="mt-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 uppercase">Bullish</span>
          </div>
          <div className="glass-panel flex flex-col items-center justify-center rounded-lg px-6 py-5 min-w-[120px] sm:min-w-[140px]">
            <span className="font-mono text-2xl font-bold text-red-500 sm:text-3xl">
              {stats?.byDirection?.bearish ?? 0}
            </span>
            <span className="mt-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 uppercase">Bearish</span>
          </div>
          <div className="glass-panel flex flex-col items-center justify-center rounded-lg px-6 py-5 min-w-[120px] sm:min-w-[140px]">
            <span className="font-mono text-2xl font-bold sm:text-3xl">
              {stats ? `${stats.avgConfidence.toFixed(0)}%` : "0%"}
            </span>
            <span className="mt-1 font-mono text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/60 uppercase">Avg Conf</span>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="glow-line" />
      </div>

      <section className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="glass-panel rounded-lg p-5 transition-all hover:border-primary/20">
              <h3 className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-primary">
                <span className="inline-block h-px w-4 bg-primary" />
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="glow-line" />
      </div>
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/signals"
          className="group inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-primary transition-colors duration-snappy ease-snappy hover:text-primary/80"
        >
          View all signals
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-snappy ease-snappy group-hover:translate-x-0.5" />
        </Link>
      </section>
    </div>
  );
}
