import { describe, expect, it, vi } from "vitest";
import { LookTwice } from "./index.js";

describe("LookTwice SDK", () => {
  it("supports 204 delete responses", async () => {
    const customFetch = vi.fn(async () => new Response(null, { status: 204 }));
    const client = new LookTwice({ apiKey: "lt_test_example", fetch: customFetch as typeof fetch });
    await expect(client.knowledge.watches.delete("watch-id")).resolves.toBeUndefined();
    expect(customFetch).toHaveBeenCalledWith(
      "https://api.looktwice.dev/v1/knowledge/watches/watch-id",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("sends idempotency keys on charged checks", async () => {
    const customFetch = vi.fn(async () =>
      Response.json({ valid: false, normalized_masked: "GB00**************5432" }),
    );
    const client = new LookTwice({ apiKey: "lt_test_example", fetch: customFetch as typeof fetch });
    await client.iban.check({ iban: "GB00WEST12345698765432" }, { idempotencyKey: "retry-safe-1" });
    expect(customFetch).toHaveBeenCalledWith(
      "https://api.looktwice.dev/v1/iban/check",
      expect.objectContaining({
        headers: expect.objectContaining({ "Idempotency-Key": "retry-safe-1" }),
      }),
    );
  });

  it("can request resolved catalog-match history", async () => {
    const customFetch = vi.fn(async () => Response.json({ data: [], disclaimer: "Review" }));
    const client = new LookTwice({ apiKey: "lt_test_example", fetch: customFetch as typeof fetch });
    await client.cpsc.catalogs.matches("catalog-id", "resolved");
    expect(customFetch).toHaveBeenCalledWith(
      "https://api.looktwice.dev/v1/cpsc/catalogs/catalog-id/matches?status=resolved",
      expect.any(Object),
    );
  });

  it("retries idempotent charged requests after a retryable upstream response", async () => {
    const customFetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ error: { code: "upstream", message: "Retry" } }, { status: 503 }),
      )
      .mockResolvedValueOnce(
        Response.json({ valid: true, checked_at: "2026-08-13T00:00:00.000Z" }),
      );
    const client = new LookTwice({
      apiKey: "lt_test_example",
      fetch: customFetch as typeof fetch,
      retryDelayMs: 0,
    });

    await expect(
      client.vat.check(
        { country_code: "DE", vat_number: "123456789" },
        { idempotencyKey: "retry-safe-2" },
      ),
    ).resolves.toMatchObject({ valid: true });
    expect(customFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-idempotent POST requests", async () => {
    const customFetch = vi.fn(async () =>
      Response.json({ error: { code: "upstream", message: "Retry" } }, { status: 503 }),
    );
    const client = new LookTwice({
      apiKey: "lt_test_example",
      fetch: customFetch as typeof fetch,
      retryDelayMs: 0,
    });

    await expect(client.cpsc.catalogs.create({ name: "Catalog" })).rejects.toMatchObject({
      status: 503,
    });
    expect(customFetch).toHaveBeenCalledTimes(1);
  });
});
