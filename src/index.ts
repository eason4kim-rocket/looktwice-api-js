import type {
  CatalogItemsRequest,
  CpscRecallMatchRequest,
  CpscRecallMatchResponse,
  CreateCatalogRequest,
  CreateKnowledgeWatchRequest,
  CreateWebhookEndpointRequest,
  DomainCheckRequest,
  DomainCheckResponse,
  EmailCheckRequest,
  EmailCheckResponse,
  IbanCheckRequest,
  IbanCheckResponse,
  VatCheckRequest,
  VatCheckResponse,
} from "./types.js";

export type * from "./types.js";

export class LookTwiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId: string | null,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
};

export type LookTwiceOptions = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  maxRetries?: number;
  retryDelayMs?: number;
};

type ListResponse<T = Record<string, unknown>> = { data: T[]; next_cursor?: string | null };

export class LookTwice {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly customFetch: typeof fetch;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: LookTwiceOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.looktwice.dev").replace(/\/$/, "");
    this.customFetch = options.fetch ?? fetch;
    this.maxRetries = Math.max(0, Math.floor(options.maxRetries ?? 2));
    this.retryDelayMs = Math.max(0, Math.floor(options.retryDelayMs ?? 250));
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? (options.body === undefined ? "GET" : "POST");
    const retryableRequest = method === "GET" || Boolean(options.idempotencyKey);
    let response: Response | undefined;
    let lastNetworkError: unknown;

    for (let attempt = 0; attempt <= (retryableRequest ? this.maxRetries : 0); attempt += 1) {
      try {
        response = await this.customFetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
            ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
          },
          ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
        });
      } catch (error) {
        lastNetworkError = error;
        if (attempt >= this.maxRetries || !retryableRequest) throw error;
        await this.waitBeforeRetry(attempt);
        continue;
      }

      if (!this.shouldRetry(response.status) || attempt >= this.maxRetries || !retryableRequest) {
        break;
      }
      await this.waitBeforeRetry(attempt, response.headers.get("retry-after"));
    }

    if (!response) {
      throw lastNetworkError instanceof Error
        ? lastNetworkError
        : new Error("LookTwice request failed before receiving a response");
    }
    const payload =
      response.status === 204
        ? undefined
        : ((await response.json()) as T & {
            error?: {
              code: string;
              message: string;
              request_id?: string;
              details?: Record<string, unknown>;
            };
          });
    if (!response.ok) {
      const errorPayload = payload as
        | {
            error?: {
              code: string;
              message: string;
              request_id?: string;
              details?: Record<string, unknown>;
            };
          }
        | undefined;
      throw new LookTwiceError(
        errorPayload?.error?.message ?? `LookTwice request failed (${response.status})`,
        response.status,
        errorPayload?.error?.code ?? "request_failed",
        errorPayload?.error?.request_id ?? response.headers.get("x-request-id"),
        errorPayload?.error?.details,
      );
    }
    return payload as T;
  }

  private shouldRetry(status: number) {
    return (
      status === 408 ||
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  }

  private async waitBeforeRetry(attempt: number, retryAfter: string | null = null) {
    const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
    const delay = Number.isFinite(retryAfterSeconds)
      ? Math.max(0, retryAfterSeconds * 1_000)
      : this.retryDelayMs * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 30_000)));
  }

  email = {
    check: (body: EmailCheckRequest, options: { idempotencyKey: string }) =>
      this.request<EmailCheckResponse>("/v1/email/check", { body, ...options }),
  };

  vat = {
    check: (body: VatCheckRequest, options: { idempotencyKey: string }) =>
      this.request<VatCheckResponse>("/v1/vat/check", { body, ...options }),
  };

  iban = {
    check: (body: IbanCheckRequest, options: { idempotencyKey: string }) =>
      this.request<IbanCheckResponse>("/v1/iban/check", { body, ...options }),
  };

  domain = {
    check: (body: DomainCheckRequest) =>
      this.request<DomainCheckResponse>("/v1/domain/check", { body }),
  };

  cpsc = {
    recallMatch: (body: CpscRecallMatchRequest, options: { idempotencyKey: string }) =>
      this.request<CpscRecallMatchResponse>("/v1/cpsc/recall-match", { body, ...options }),
    catalogs: {
      create: (body: CreateCatalogRequest) =>
        this.request<Record<string, unknown>>("/v1/cpsc/catalogs", { body }),
      list: () => this.request<ListResponse>("/v1/cpsc/catalogs"),
      upsertItems: (catalogId: string, body: CatalogItemsRequest) =>
        this.request<{ accepted: number; catalog_id: string }>(
          `/v1/cpsc/catalogs/${catalogId}/items`,
          { body },
        ),
      matches: (catalogId: string, status: "active" | "resolved" | "all" = "active") =>
        this.request<ListResponse & { disclaimer: string }>(
          `/v1/cpsc/catalogs/${catalogId}/matches?status=${status}`,
        ),
      delete: (catalogId: string) =>
        this.request<void>(`/v1/cpsc/catalogs/${catalogId}`, { method: "DELETE" }),
    },
  };

  knowledge = {
    watches: {
      create: (body: CreateKnowledgeWatchRequest) =>
        this.request<Record<string, unknown>>("/v1/knowledge/watches", { body }),
      list: () => this.request<ListResponse>("/v1/knowledge/watches"),
      get: (watchId: string) =>
        this.request<Record<string, unknown>>(`/v1/knowledge/watches/${watchId}`),
      delete: (watchId: string) =>
        this.request<void>(`/v1/knowledge/watches/${watchId}`, { method: "DELETE" }),
    },
  };

  credits = {
    balance: () =>
      this.request<{
        available: number;
        reserved: number;
        expiring: Array<{ credits: number; expires_at: string; source: "promo" | "subscription" }>;
      }>("/v1/credits/balance"),
  };

  usage = {
    list: (options: { limit?: number; cursor?: string } = {}) => {
      const query = new URLSearchParams();
      if (options.limit) query.set("limit", String(options.limit));
      if (options.cursor) query.set("cursor", options.cursor);
      return this.request<ListResponse>(`/v1/usage${query.size ? `?${query}` : ""}`);
    },
  };

  prices = {
    get: () => this.request<Record<string, unknown>>("/v1/prices"),
  };

  webhookEndpoints = {
    create: (body: CreateWebhookEndpointRequest) =>
      this.request<Record<string, unknown>>("/v1/webhook-endpoints", { body }),
    list: () => this.request<ListResponse>("/v1/webhook-endpoints"),
  };

  events = {
    list: (limit = 50) =>
      this.request<ListResponse>(`/v1/events?limit=${encodeURIComponent(limit)}`),
    replayDelivery: (deliveryId: string) =>
      this.request<{ id: string; status: "pending" }>(
        `/v1/webhook-deliveries/${deliveryId}/replay`,
        {
          method: "POST",
        },
      ),
  };

  billing = {
    autoReload: {
      get: () => this.request<Record<string, unknown>>("/v1/billing/auto-reload"),
      update: (body: {
        enabled: boolean;
        threshold_credits: number;
        topup_pack_id: "payg_10" | "payg_50" | "payg_200" | "payg_900";
        monthly_limit_usd_cents: number;
        consent: boolean;
      }) =>
        this.request<Record<string, unknown>>("/v1/billing/auto-reload", { method: "PUT", body }),
    },
  };
}
