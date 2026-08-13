import { randomUUID } from "node:crypto";
import console from "node:console";
import { LookTwice } from "looktwice";

const apiKey = process.env.LOOKTWICE_API_KEY;
if (!apiKey) throw new Error("Set LOOKTWICE_API_KEY before running this example");

const client = new LookTwice({ apiKey });
const result = await client.cpsc.recallMatch(
  {
    product_name: "Consumer product",
    upc: "805253435117",
  },
  { idempotencyKey: randomUUID() },
);

console.log({
  matchLevel: result.match_level,
  checkedAt: result.checked_at,
  sources: result.sources_checked,
  candidates: result.candidates.map((candidate) => ({
    recallNumber: candidate.recall_number,
    matchLevel: candidate.match_level,
    matchedOn: candidate.matched_on,
    officialUrl: candidate.official_url,
  })),
});

// A `none` result is not a safety or legal clearance. Review the named sources,
// identifiers, official notice, product condition, and applicable rules.
