import type { SoSoValueClient } from "@market-zap/sosovalue-client";

export interface AnalyzerResult {
  dataType: string;
  data: unknown;
  instructions: string;
  sourceType: "price_action" | "news_event" | "macro_event" | "index_divergence" | "sector_rotation" | "etf_flow" | "fundraising";
}

export async function analyzeMarketSnapshots(
  client: SoSoValueClient,
  currencyIds: string[],
): Promise<AnalyzerResult[]> {
  const results: AnalyzerResult[] = [];
  for (const id of currencyIds.slice(0, 10)) {
    try {
      const snapshot = await client.getCurrencyMarketSnapshot(id);
      const info = await client.getCurrencyInfo(id);
      results.push({
        dataType: `Market snapshot: ${info.name} (${info.full_name})`,
        data: snapshot,
        instructions: `Analyze this market snapshot for ${info.name}. Identify significant price movements, volume anomalies, key support/resistance levels from 24h high/low, and assess market cap trends. Generate a signal if actionable.`,
        sourceType: "price_action",
      });
    } catch {
      continue;
    }
  }
  return results;
}

export async function analyzeNews(
  client: SoSoValueClient,
  currencyFilter?: string,
): Promise<AnalyzerResult[]> {
  try {
    const news = await client.getNews({
      page_size: 20,
      currency_id: currencyFilter,
    });
    if (news.list.length === 0) return [];
    return [{
      dataType: "Crypto news feed",
      data: news.list.map((item) => ({
        title: item.title,
        author: item.author,
        tags: item.tags,
        matched_currencies: item.matched_currencies,
        impression_count: item.impression_count,
        like_count: item.like_count,
        reply_count: item.reply_count,
        retweet_count: item.retweet_count,
        release_time: new Date(item.release_time).toISOString(),
      })),
      instructions: `Analyze this batch of crypto news. Identify:
1. Breaking news that could impact asset prices
2. Sentiment trends (bullish/bearish themes)
3. Assets mentioned across multiple high-engagement posts
4. Potential market-moving events

Generate focused signals for the most impactful stories.`,
      sourceType: "news_event",
    }];
  } catch {
    return [];
  }
}

export async function analyzeMacroEvents(
  client: SoSoValueClient,
): Promise<AnalyzerResult[]> {
  try {
    const events = await client.getMacroEvents();
    if (events.length === 0) return [];
    return [{
      dataType: "Macroeconomic events",
      data: events.map((e) => ({
        name: e.name,
        date: new Date(e.date).toISOString(),
        country: e.country,
        actual: e.actual,
        forecast: e.forecast,
        previous: e.previous,
        impact: e.impact,
      })),
      instructions: `Analyze these upcoming macroeconomic events. Identify:
1. High-impact events that could move crypto markets
2. Events where actual vs forecast divergence is expected
3. Events correlated with specific crypto sectors (e.g., Fed rate decisions)
4. Potential volatility triggers

Generate signals for the most significant events.`,
      sourceType: "macro_event",
    }];
  } catch {
    return [];
  }
}

export async function analyzeIndices(
  client: SoSoValueClient,
): Promise<AnalyzerResult[]> {
  try {
    const indices = await client.getIndices();
    if (indices.length === 0) return [];
    const snapshots = await Promise.allSettled(
      indices.slice(0, 5).map((idx) =>
        client.getIndexMarketSnapshot(idx.ticker)
      ),
    );
    const indexData = indices.slice(0, 5).map((idx, i) => {
      const snap = snapshots[i];
      return {
        ticker: idx.ticker,
        name: idx.name,
        description: idx.description,
        price: idx.price,
        change_24h: idx.change_pct_24h,
        snapshot: snap.status === "fulfilled" ? snap.value : null,
      };
    });
    return [{
      dataType: "SoSoValue Index performance",
      data: indexData,
      instructions: `Analyze SoSoValue proprietary index performance. Look for:
1. Indexes showing unusual divergence from their constituents
2. Index momentum (comparing 7d vs 24h performance)
3. Rebalancing opportunities or sector rotation signals
4. Indexes at key technical levels

Generate signals based on index divergence and momentum.`,
      sourceType: "index_divergence",
    }];
  } catch {
    return [];
  }
}

export async function analyzeSectors(
  client: SoSoValueClient,
): Promise<AnalyzerResult[]> {
  try {
    const sectors = await client.getSectorSpotlight();
    if (sectors.length === 0) return [];
    return [{
      dataType: "Sector spotlight data",
      data: sectors,
      instructions: `Analyze crypto sector rotation. Identify:
1. Sectors with strongest 24h momentum
2. Sectors showing reversal patterns (previous laggards becoming leaders)
3. Capital flow patterns between sectors
4. Emerging sector narratives

Generate signals for sector rotation trades and identifying leading/lagging sectors.`,
      sourceType: "sector_rotation",
    }];
  } catch {
    return [];
  }
}

export async function analyzeETFs(
  client: SoSoValueClient,
): Promise<AnalyzerResult[]> {
  try {
    const etfs = await client.getETFs();
    if (etfs.length === 0) return [];
    return [{
      dataType: "Crypto ETF data",
      data: etfs,
      instructions: `Analyze crypto ETF performance. Identify:
1. ETFs with unusual volume or price movement
2. Premium/discount divergences (arbitrage signals)
3. ETF flow trends (which ETFs are attracting capital)
4. Correlation between ETF performance and underlying assets

Generate signals for ETF-based trading opportunities.`,
      sourceType: "etf_flow",
    }];
  } catch {
    return [];
  }
}

export async function analyzeFundraising(
  client: SoSoValueClient,
): Promise<AnalyzerResult[]> {
  try {
    const rounds = await client.getFundraisingProjects({ page_size: 10 });
    if (rounds.list.length === 0) return [];
    return [{
      dataType: "Crypto fundraising / VC rounds",
      data: rounds.list,
      instructions: `Analyze recent crypto fundraising rounds. Identify:
1. Large rounds that signal institutional interest
2. Sector trends in fundraising (which sectors are attracting capital)
3. Notable investors involved
4. Potential tokens to watch

Generate signals for significant fundraising events.`,
      sourceType: "fundraising",
    }];
  } catch {
    return [];
  }
}

export type AnalyzerFunction = (client: SoSoValueClient) => Promise<AnalyzerResult[]>;

export const analyzers: Record<string, AnalyzerFunction> = {
  // price_action is handled specially in runAnalysis (monitoredCurrencyIds are injected there)
  price_action: (_c: SoSoValueClient) => Promise.resolve([]),
  news_event: analyzeNews,
  macro_event: analyzeMacroEvents,
  index_divergence: analyzeIndices,
  sector_rotation: analyzeSectors,
  etf_flow: analyzeETFs,
  fundraising: analyzeFundraising,
};
