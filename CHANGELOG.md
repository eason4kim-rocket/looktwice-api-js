# Changelog

## 0.1.1 - 2026-08-16

- Wrap non-JSON HTTP failures in `LookTwiceError` instead of leaking `SyntaxError`.
- Accept successful empty response bodies, including `200` responses from delete endpoints.
- Reject non-empty, non-JSON success responses with a typed `invalid_response` error.
- Preserve usage-list query parameters across every supported Node.js 18+ runtime.
- Report SDK errors as `LookTwiceError` and add runtime compatibility checks for Node.js 18, 20, 22, and 24.

## 0.1.0 - 2026-08-13

- Initial public TypeScript SDK.
- Typed Email, VAT, IBAN, Domain, CPSC, Knowledge Watch, usage, credit, and webhook clients.
- Typed API errors and safe retry handling.
- Retry-safe charged requests through explicit idempotency keys.
