# LookTwice examples

These examples call the production API with your own key. Create a key at [looktwice.dev/dashboard](https://looktwice.dev/dashboard), then export it without committing it:

```bash
export LOOKTWICE_API_KEY="lt_live_..."
```

- `node/quickstart.mjs`: Email, VAT, IBAN, and Domain checks with the TypeScript SDK.
- `node/cpsc-recall-match.mjs`: A single evidence-backed CPSC recall screen.
- `node/webhook-verify.mjs`: HMAC-SHA256 webhook verification using the raw request body.
- `python/vat_check.py`: Standard-library Python VAT request.
- `curl/iban-check.sh`: Minimal curl request with an idempotency key.
- `fixtures/cpsc-products.csv`: Small catalog fixture for integration experiments; values are illustrative.

Never expose a live API key in browser code, screenshots, public repositories, or support messages.
