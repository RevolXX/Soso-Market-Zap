import type {
  SosoApiResponse,
  PaginatedData,
  CurrencyMarketSnapshot,
  CurrencyInfo,
  Kline,
  TradingPair,
  SectorSpotlight,
  IndexInfo,
  IndexConstituent,
  IndexMarketSnapshot,
  ETFInfo,
  ETFMarketSnapshot,
  CryptoStockInfo,
  CryptoStockSnapshot,
  NewsItem,
  MacroEvent,
  ChartInfo,
  ChartDataPoint,
  FundraisingProject,
} from "./types.js";

export class SoSoValueError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status: number,
  ) {
    super(message);
    this.name = "SoSoValueError";
  }
}

export interface SoSoValueClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class SoSoValueClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: SoSoValueClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "https://openapi.sosovalue.com/openapi/v1").replace(/\/+$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "x-soso-api-key": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new SoSoValueError(
        `SoSoValue API error: ${response.status} ${response.statusText}`,
        0,
        response.status,
      );
    }

    const json = (await response.json()) as SosoApiResponse<T>;
    if (json.code !== 0) {
      throw new SoSoValueError(
        json.message ?? "Unknown SoSoValue API error",
        json.code,
        response.status,
      );
    }

    return json.data;
  }

  private async get<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    return this.request<T>("GET", path, params);
  }

  // -----------------------------------------------------------------------
  // Currencies
  // -----------------------------------------------------------------------

  async getCurrencies(): Promise<CurrencyInfo[]> {
    return this.get<CurrencyInfo[]>("/currencies");
  }

  async getCurrencyInfo(currencyId: string): Promise<CurrencyInfo> {
    return this.get<CurrencyInfo>(`/currencies/${encodeURIComponent(currencyId)}`);
  }

  async getCurrencyMarketSnapshot(currencyId: string): Promise<CurrencyMarketSnapshot> {
    return this.get<CurrencyMarketSnapshot>(
      `/currencies/${encodeURIComponent(currencyId)}/market-snapshot`,
    );
  }

  async getCurrencyKlines(
    currencyId: string,
    params?: { interval?: string; limit?: number; start_time?: number; end_time?: number },
  ): Promise<Kline[]> {
    return this.get<Kline[]>(
      `/currencies/${encodeURIComponent(currencyId)}/klines`,
      params as Record<string, string | number | undefined>,
    );
  }

  async getCurrencyPairs(currencyId: string): Promise<TradingPair[]> {
    return this.get<TradingPair[]>(
      `/currencies/${encodeURIComponent(currencyId)}/pairs`,
    );
  }

  async getSectorSpotlight(): Promise<SectorSpotlight[]> {
    return this.get<SectorSpotlight[]>("/currencies/sector-spotlight");
  }

  // -----------------------------------------------------------------------
  // SoSoValue Indices
  // -----------------------------------------------------------------------

  async getIndices(): Promise<IndexInfo[]> {
    return this.get<IndexInfo[]>("/indices");
  }

  async getIndexConstituents(indexTicker: string): Promise<IndexConstituent[]> {
    return this.get<IndexConstituent[]>(
      `/indices/${encodeURIComponent(indexTicker)}/constituents`,
    );
  }

  async getIndexMarketSnapshot(indexTicker: string): Promise<IndexMarketSnapshot> {
    return this.get<IndexMarketSnapshot>(
      `/indices/${encodeURIComponent(indexTicker)}/market-snapshot`,
    );
  }

  async getIndexKlines(
    indexTicker: string,
    params?: { interval?: string; limit?: number },
  ): Promise<Kline[]> {
    return this.get<Kline[]>(
      `/indices/${encodeURIComponent(indexTicker)}/klines`,
      params as Record<string, string | number | undefined>,
    );
  }

  // -----------------------------------------------------------------------
  // ETF
  // -----------------------------------------------------------------------

  async getETFs(): Promise<ETFInfo[]> {
    return this.get<ETFInfo[]>("/etfs");
  }

  async getETFMarketSnapshot(ticker: string): Promise<ETFMarketSnapshot> {
    return this.get<ETFMarketSnapshot>(
      `/etfs/${encodeURIComponent(ticker)}/market-snapshot`,
    );
  }

  // -----------------------------------------------------------------------
  // Crypto Stocks
  // -----------------------------------------------------------------------

  async getCryptoStocks(): Promise<CryptoStockInfo[]> {
    return this.get<CryptoStockInfo[]>("/crypto-stocks");
  }

  async getCryptoStockSnapshot(ticker: string): Promise<CryptoStockSnapshot> {
    return this.get<CryptoStockSnapshot>(
      `/crypto-stocks/${encodeURIComponent(ticker)}/market-snapshot`,
    );
  }

  // -----------------------------------------------------------------------
  // News
  // -----------------------------------------------------------------------

  async getNews(params?: {
    category?: number;
    language?: string;
    currency_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedData<NewsItem>> {
    return this.get<PaginatedData<NewsItem>>(
      "/news",
      params as Record<string, string | number | undefined>,
    );
  }

  async getHotNews(params?: {
    language?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedData<NewsItem>> {
    return this.get<PaginatedData<NewsItem>>(
      "/news/hot",
      params as Record<string, string | number | undefined>,
    );
  }

  async getFeaturedNews(params?: {
    language?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedData<NewsItem>> {
    return this.get<PaginatedData<NewsItem>>(
      "/news/featured",
      params as Record<string, string | number | undefined>,
    );
  }

  // -----------------------------------------------------------------------
  // Macro Events
  // -----------------------------------------------------------------------

  async getMacroEvents(params?: {
    date?: string;
    country?: string;
  }): Promise<MacroEvent[]> {
    return this.get<MacroEvent[]>(
      "/macro/events",
      params as Record<string, string | number | undefined>,
    );
  }

  // -----------------------------------------------------------------------
  // Analysis Charts
  // -----------------------------------------------------------------------

  async getAnalyses(): Promise<ChartInfo[]> {
    return this.get<ChartInfo[]>("/analyses");
  }

  async getChartData(chartName: string): Promise<ChartDataPoint[]> {
    return this.get<ChartDataPoint[]>(
      `/analyses/${encodeURIComponent(chartName)}`,
    );
  }

  // -----------------------------------------------------------------------
  // Fundraising
  // -----------------------------------------------------------------------

  async getFundraisingProjects(params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedData<FundraisingProject>> {
    return this.get<PaginatedData<FundraisingProject>>(
      "/fundraising/projects",
      params as Record<string, string | number | undefined>,
    );
  }
}
