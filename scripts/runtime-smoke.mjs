import assert from "node:assert/strict";
import console from "node:console";
import process from "node:process";
import { LookTwice, LookTwiceError } from "../dist/index.js";

const ResponseConstructor = globalThis.Response;

let requestedUrl;
const usageClient = new LookTwice({
  apiKey: "lt_test_example",
  fetch: async (url) => {
    requestedUrl = String(url);
    return new ResponseConstructor(JSON.stringify({ data: [] }), {
      headers: { "content-type": "application/json" },
    });
  },
});

await usageClient.usage.list({ limit: 10, cursor: "next page" });
assert.equal(requestedUrl, "https://api.looktwice.dev/v1/usage?limit=10&cursor=next+page");

const emptyBodyClient = new LookTwice({
  apiKey: "lt_test_example",
  fetch: async () => new ResponseConstructor(null, { status: 200 }),
});
assert.equal(await emptyBodyClient.knowledge.watches.delete("watch-id"), undefined);

const nonJsonErrorClient = new LookTwice({
  apiKey: "lt_test_example",
  maxRetries: 0,
  fetch: async () => new ResponseConstructor("<html>502</html>", { status: 502 }),
});

await assert.rejects(nonJsonErrorClient.prices.get(), (error) => {
  assert.ok(error instanceof LookTwiceError);
  assert.equal(error.name, "LookTwiceError");
  assert.equal(error.status, 502);
  assert.equal(error.code, "request_failed");
  return true;
});

console.log(`Runtime smoke test passed on Node.js ${process.version}`);
