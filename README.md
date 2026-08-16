# looktwice-api

[![npm version](https://img.shields.io/npm/v/looktwice-api)](https://www.npmjs.com/package/looktwice-api)
[![license](https://img.shields.io/npm/l/looktwice-api)](./LICENSE)

Official, dependency-free TypeScript SDK for the [LookTwice API](https://looktwice.dev).
Email, EU VAT, IBAN, and domain checks, plus evidence-backed CPSC recall screening.

```bash
curl -sS https://api.looktwice.dev/v1/vat/check \
  -H "Authorization: Bearer $LOOKTWICE_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"country_code":"DE","vat_number":"123456789"}'
```

OpenAPI: [https://api.looktwice.dev/docs/json](https://api.looktwice.dev/docs/json)

## Install

```bash
npm install looktwice-api
```

Node.js 18 or newer is required. The SDK is intended for server-side applications; never expose a live API key in public browser code.

## Tools

| Method | What it does | Does not claim |
| --- | --- | --- |
| `client.email.check` | Syntax, MX, disposable, role, free-provider signals | Mailbox existence |
| `client.vat.check` | Live EU VIES result, returned business fields, request evidence | Permanent tax status |
| `client.iban.check` | Country length and ISO 7064 MOD-97 | Account existence or ownership |
| `client.domain.check` | DNS, MX, TLS, RDAP for a registrable domain | Website safety |
| `client.cpsc.recallMatch` | Ranked candidates against CPSC recalls and warnings | Safety, legality, or clearance |

## Run your first check

Create a key in the [LookTwice dashboard](https://looktwice.dev/dashboard), then:

```ts
import { randomUUID } from "node:crypto";
import { LookTwice } from "looktwice-api";

const client = new LookTwice({
  apiKey: process.env.LOOKTWICE_API_KEY!,
});

const result = await client.vat.check(
  { country_code: "DE", vat_number: "123456789" },
  { idempotencyKey: randomUUID() },
);

console.log(result.valid, result.checked_at, result.request_identifier);
```

Charged checks require an idempotency key. Reusing the same key with the same request body returns the original result without charging twice. The SDK retries safe GET requests and requests carrying an idempotency key on `408`, `429`, and retryable `5xx` responses.

## Main methods

```ts
client.email.check(input, { idempotencyKey });
client.vat.check(input, { idempotencyKey });
client.iban.check(input, { idempotencyKey });
client.domain.check(input);
client.cpsc.recallMatch(input, { idempotencyKey });

client.cpsc.catalogs.create(input);
client.cpsc.catalogs.upsertItems(catalogId, input);
client.cpsc.catalogs.matches(catalogId, "active");

client.knowledge.watches.create(input);
client.knowledge.watches.get(watchId);

client.credits.balance();
client.usage.list();
client.prices.get();
```

## Compared with building it yourself

| Need | Typical in-house path | What this SDK keeps explicit |
| --- | --- | --- |
| EU VAT | Call VIES, then invent retry and evidence storage | Valid / invalid / unavailable stay separate; request identifier and check time are returned |
| Email | Regex plus a stale disposable list | MX and disposable signals; no SMTP probe |
| IBAN | Regex or checksum-only library | Country length + MOD-97; no account-existence claim |
| CPSC | Keyword search of the public feed | UPC/brand/model ranking with official URLs and timestamps |

## Typed errors

```ts
import { LookTwiceError } from "looktwice-api";

try {
  await client.iban.check({ iban: "not-an-iban" }, { idempotencyKey: crypto.randomUUID() });
} catch (error) {
  if (error instanceof LookTwiceError) {
    console.error(error.status, error.code, error.requestId, error.details);
  }
}
```

## Retry control

```ts
const client = new LookTwice({
  apiKey: process.env.LOOKTWICE_API_KEY!,
  maxRetries: 2,
  retryDelayMs: 250,
});
```

Non-idempotent POST requests are not retried automatically. Keep one idempotency key for all retries of the same logical charged request; do not generate a new key for every network attempt.

`client.domain.check` is a free, quota-limited POST without an idempotency key, so the SDK deliberately does not retry it after an ambiguous network failure.

## Honest product boundaries

- Email Check does not probe whether a mailbox exists.
- IBAN Check validates structure and checksum; it does not confirm that an account exists or belongs to someone.
- A CPSC `none` result means no match was found in the named, time-stamped sources. It is not a safety or legal clearance.
- Knowledge Watch supports public HTTPS pages and reports evidence-backed fact changes.

See the [API documentation](https://looktwice.dev/docs), [pricing](https://looktwice.dev/pricing), and [free browser tools](https://looktwice.dev/tools).

## Support and security

- Product support: [support@looktwice.dev](mailto:support@looktwice.dev)
- Security reports: see [SECURITY.md](./SECURITY.md)
- License: MIT
