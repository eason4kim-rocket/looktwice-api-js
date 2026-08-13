# looktwice

Official, dependency-free TypeScript SDK for the [LookTwice API](https://looktwice.dev).
Validate business inputs, screen products against CPSC recall evidence, and watch important facts.

## Install

```bash
npm install looktwice
```

Node.js 18 or newer is required. Modern browsers and edge runtimes can use the SDK when an API key can be stored securely; never expose a live key in public client-side code.

## Run your first check

Create a key in the [LookTwice dashboard](https://looktwice.dev/dashboard), then:

```ts
import { randomUUID } from "node:crypto";
import { LookTwice } from "looktwice";

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

## Typed errors

```ts
import { LookTwiceError } from "looktwice";

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
