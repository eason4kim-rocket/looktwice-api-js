import { randomUUID } from "node:crypto";
import console from "node:console";
import { LookTwice } from "looktwice-api";

const apiKey = process.env.LOOKTWICE_API_KEY;
if (!apiKey) throw new Error("Set LOOKTWICE_API_KEY before running this example");

const client = new LookTwice({ apiKey });

const vat = await client.vat.check(
  { country_code: "DE", vat_number: "123456789" },
  { idempotencyKey: randomUUID() },
);
console.log("VAT", { valid: vat.valid, checkedAt: vat.checked_at });

const iban = await client.iban.check(
  { iban: "GB82 WEST 1234 5698 7654 32" },
  { idempotencyKey: randomUUID() },
);
console.log("IBAN", { valid: iban.valid, country: iban.country_code });

const email = await client.email.check(
  { email: "hello@example.com" },
  { idempotencyKey: randomUUID() },
);
console.log("Email", {
  syntaxValid: email.syntax_valid,
  mxPresent: email.mx_present,
  mailboxStatus: email.mailbox_status,
});

const domain = await client.domain.check({ domain: "example.com" });
console.log("Domain", { mxStatus: domain.mx_status, tls: domain.tls.status });
