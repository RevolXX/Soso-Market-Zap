// -----------------------------------------------------------------------
// SoDEX API Types
// -----------------------------------------------------------------------

export interface SodexOrderItem {
  clOrdID: string;
  modifier: number;
  side: number;
  type: number;
  timeInForce: number;
  price: string;
  quantity: string;
  funds?: string;
  stopPrice?: string;
  stopType?: number;
  triggerType?: number;
  reduceOnly: boolean;
  positionSide: number;
}

export interface SodexNewOrderParams {
  accountID: number;
  symbolID: number;
  orders: SodexOrderItem[];
}

export interface SodexCancelOrderParams {
  accountID: number;
  symbolID: number;
  clOrdIDs: string[];
}

export interface SodexAccountState {
  aid: number;
  userAddress: string;
  collateral: string;
  margin: string;
  unrealizedPnl: string;
  availableBalance: string;
}

export interface SodexTicker {
  symbolID: number;
  symbol: string;
  price: string;
  change24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
}

// -----------------------------------------------------------------------
// Client Configuration
// -----------------------------------------------------------------------

export interface SodexClientConfig {
  /** API endpoint for REST calls */
  baseUrl: string;
  /** Your SoDEX account ID */
  accountID: number;
  /** API key name (sent in X-API-Key header) */
  apiKeyName: string;
  /** EIP-712 signing function. Required for order placement/cancellation. */
  signer?: SodexSigner;
  /** Chain ID (mainnet: 286623, testnet: 138565) */
  chainId?: number;
  /** Domain name ("spot" or "futures") */
  domainName?: "spot" | "futures";
}

/**
 * Signing function for EIP-712 ExchangeAction messages.
 * Implement this using ethers, viem, or any web3 library.
 */
export type SodexSigner = (payload: {
  type: string;
  params: unknown;
  nonce: number;
  domainName: string;
  chainId: number;
}) => Promise<string>;

// -----------------------------------------------------------------------
// SoDEX Client
// -----------------------------------------------------------------------

export class SodexClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "SodexClientError";
  }
}

export class SodexClient {
  private config: SodexClientConfig;

  constructor(config: SodexClientConfig) {
    this.config = config;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    nonce?: number,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const nonceValue = nonce ?? Date.now();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": this.config.apiKeyName,
      "X-API-Nonce": String(nonceValue),
    };

    if (this.config.signer && body) {
      const signature = await this.config.signer({
        type: method === "POST" ? "newOrder" : "cancelOrder",
        params: body,
        nonce: nonceValue,
        domainName: this.config.domainName ?? "spot",
        chainId: this.config.chainId ?? 138565,
      });
      headers["X-API-Sign"] = signature;
    } else {
      headers["X-API-Sign"] = "0x0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => undefined);
      throw new SodexClientError(
        `SoDEX API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    return (await response.json()) as T;
  }

  // -----------------------------------------------------------------------
  // Account
  // -----------------------------------------------------------------------

  async getAccountState(userAddress: string): Promise<SodexAccountState> {
    return this.request<SodexAccountState>(
      "GET",
      `/accounts/${userAddress}/state`,
    );
  }

  // -----------------------------------------------------------------------
  // Orders
  // -----------------------------------------------------------------------

  async newOrder(
    params: SodexNewOrderParams,
    nonce?: number,
  ): Promise<{ orderID: string; status: string }> {
    return this.request<{ orderID: string; status: string }>(
      "POST",
      "/trade/orders",
      params,
      nonce,
    );
  }

  async cancelOrder(
    params: SodexCancelOrderParams,
    nonce?: number,
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      "POST",
      "/trade/orders/cancel",
      params,
      nonce,
    );
  }

  // -----------------------------------------------------------------------
  // Market Data
  // -----------------------------------------------------------------------

  async getTickers(): Promise<SodexTicker[]> {
    return this.request<SodexTicker[]>("GET", "/market/tickers");
  }

  async getOrderBook(symbolID: number, depth = 20): Promise<{
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
  }> {
    return this.request<{ bids: Array<[string, string]>; asks: Array<[string, string]> }>(
      "GET",
      `/market/orderbook?symbolID=${symbolID}&depth=${depth}`,
    );
  }
}
