export interface LLMConfig {
  provider: "groq" | "openai" | "anthropic" | "custom";
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  baseUrl?: string;
}

export interface LLMAnalysisRequest {
  dataType: string;
  data: unknown;
  instructions: string;
}

export interface LLMAnalysisResult {
  title: string;
  reasoning: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  targetPrice: number | null;
  stopLoss: number | null;
  timeframe: string;
  relatedAssets: string[];
}

export class SignalLLM {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  private buildSystemPrompt(): string {
    return (
      this.config.systemPrompt ??
      `You are a professional crypto market analyst. Analyze the provided financial data and generate trading signals.
Be precise with numbers, cite specific data points, and clearly state your confidence level.
Always output valid JSON matching the requested schema.
Focus on actionable insights with clear entry, target, and stop levels.`
    );
  }

  async analyze(request: LLMAnalysisRequest): Promise<LLMAnalysisResult> {
    switch (this.config.provider) {
      case "groq":
      case "openai":
      default:
        return this.analyzeOpenAICompatible(request);
      case "anthropic":
        return this.analyzeAnthropic(request);
    }
  }

  private get baseUrl(): string {
    if (this.config.baseUrl) return this.config.baseUrl;
    switch (this.config.provider) {
      case "groq": return "https://api.groq.com/openai/v1";
      case "openai": return "https://api.openai.com/v1";
      default: return "https://api.openai.com/v1";
    }
  }

  private async analyzeOpenAICompatible(
    request: LLMAnalysisRequest,
  ): Promise<LLMAnalysisResult> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: this.buildSystemPrompt() },
          {
            role: "user",
            content: `Analyze this ${request.dataType} data and generate a trading signal.

Instructions: ${request.instructions}

Data:
${JSON.stringify(request.data, null, 2)}

Respond with a JSON object exactly matching this schema:
{
  "title": "string - short signal title",
  "reasoning": "string - detailed analysis",
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": number (0-100),
  "severity": "low" | "medium" | "high" | "critical",
  "targetPrice": number | null,
  "stopLoss": number | null,
  "timeframe": "string e.g. 24h, 7d, 1m",
  "relatedAssets": ["string - asset symbols"]
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`${this.config.provider} API error: ${response.status} — ${body}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${this.config.provider} returned empty response`);

    return JSON.parse(content) as LLMAnalysisResult;
  }

  private async analyzeAnthropic(
    request: LLMAnalysisRequest,
  ): Promise<LLMAnalysisResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: `Analyze this ${request.dataType} data and generate a trading signal.

Instructions: ${request.instructions}

Data:
${JSON.stringify(request.data, null, 2)}

Respond with a JSON object exactly matching this schema:
{
  "title": "string - short signal title",
  "reasoning": "string - detailed analysis",
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": number (0-100),
  "severity": "low" | "medium" | "high" | "critical",
  "targetPrice": number | null,
  "stopLoss": number | null,
  "timeframe": "string e.g. 24h, 7d, 1m",
  "relatedAssets": ["string - asset symbols"]
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const json = (await response.json()) as {
      content: Array<{ text: string }>;
    };
    const content = json.content?.[0]?.text;
    if (!content) throw new Error("Anthropic returned empty response");

    return JSON.parse(content) as LLMAnalysisResult;
  }
}
