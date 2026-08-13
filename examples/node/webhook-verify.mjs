import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

export function verifyLookTwiceWebhook({ rawBody, signatureHeader, secret }) {
  const supplied = signatureHeader.replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

// Framework note: verify the exact raw bytes received from LookTwice before
// parsing JSON. Re-serializing an object can change the bytes and invalidate the signature.
