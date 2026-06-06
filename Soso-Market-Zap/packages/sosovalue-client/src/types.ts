// -----------------------------------------------------------------------
// Response Envelope
// -----------------------------------------------------------------------

export interface SosoApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  list: T[];
  page: number;
  page_size: number;
  total: number;
}

// -----------------------------------------------------------------------
// Currency & Pairs
// -----------------------------------------------------------------------

export interface CurrencyMarketSnapshot {
  price: number;
  change_pct_24h: number;
  turnover_24h: number;
  turnover_rate: number;
  high_24h: number;
  low_24h: number;
  marketcap: number;
  fdv: number;
  max_supply: string | null;
  total_supply: string;
  circulating_supply: string;
  ath: number;
  ath_date: string;
  down_from_ath: string;
  cycle_low: number;
  cycle_low_date: string;
  up_from_cycle_low: string;
  marketcap_rank: number;
}

export interface CurrencyInfo {
  id: string;
  full_name: string;
  name: string;
  marketcap_rank?: number;
}

export interface Kline {
  open_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface TradingPair {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  price: number;
  volume_24h: number;
}

export interface SectorSpotlight {
  sector: string;
  change_pct_24h: number;
  marketcap: number;
  currencies: CurrencyInfo[];
}

// -----------------------------------------------------------------------
// SoSoValue Index
// -----------------------------------------------------------------------

export interface IndexInfo {
  ticker: string;
  name: string;
  description: string;
  price: number;
  change_pct_24h: number;
}

export interface IndexConstituent {
  currency_id: string;
  name: string;
  symbol: string;
  weight: number;
}

export interface IndexMarketSnapshot {
  price: number;
  "24h_change_pct": number;
  "7day_roi": number;
  "1month_roi": number;
  "3month_roi": number;
  "1year_roi": number;
  ytd: number;
}

// -----------------------------------------------------------------------
// ETF
// -----------------------------------------------------------------------

export interface ETFInfo {
  ticker: string;
  name: string;
  price: number;
  change_pct_24h: number;
  aum: number;
  nav: number;
}

export interface ETFMarketSnapshot {
  price: number;
  change_pct_24h: number;
  volume_24h: number;
  aum: number;
  nav: number;
  premium_discount: number;
}

// -----------------------------------------------------------------------
// Crypto Stocks
// -----------------------------------------------------------------------

export interface CryptoStockInfo {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change_pct_24h: number;
  marketcap: number;
}

export interface CryptoStockSnapshot {
  price: number;
  change_pct_24h: number;
  marketcap: number;
  volume_24h: number;
}

// -----------------------------------------------------------------------
// News / Feeds
// -----------------------------------------------------------------------

export interface NewsItem {
  id: string;
  source_link: string;
  original_link: string;
  release_time: number;
  title: string;
  content: string;
  author: string;
  author_description: string;
  author_avatar_url: string;
  impression_count: number;
  like_count: number;
  reply_count: number;
  retweet_count: number;
  category: number;
  feature_image: string;
  nick_name: string;
  is_blue_verified: number;
  verified_type: string;
  matched_currencies: Array<{
    id: string;
    full_name: string;
    name: string;
  }>;
  tags: string[];
  media_info: Array<{
    soso_url: string;
    original_url: string;
    short_url: string;
    type: "photo" | "video" | "gif";
  }>;
  quote_info: {
    content: string;
    impression_count: number;
    like_count: number;
    reply_count: number;
    retweet_count: number;
    created_at: number;
    media_info: unknown[];
    original_url: string;
    author_avatar_url: string;
    author: string;
    nick_name: string;
    is_blue_verified: number;
    verified_type: string;
  } | null;
}

// -----------------------------------------------------------------------
// Macro Events
// -----------------------------------------------------------------------

export interface MacroEvent {
  id: string;
  name: string;
  date: number;
  country: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: "high" | "medium" | "low";
}

// -----------------------------------------------------------------------
// Analysis Charts
// -----------------------------------------------------------------------

export interface ChartInfo {
  name: string;
  title: string;
  description: string;
  unit: string;
}

export interface ChartDataPoint {
  time: number;
  value: number;
}

// -----------------------------------------------------------------------
// Fundraising
// -----------------------------------------------------------------------

export interface FundraisingProject {
  id: string;
  name: string;
  sector: string;
  total_raised: number;
  round: string;
  date: number;
  investors: string[];
}
