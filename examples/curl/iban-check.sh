#!/usr/bin/env sh
set -eu

: "${LOOKTWICE_API_KEY:?Set LOOKTWICE_API_KEY before running this example}"

curl --fail-with-body https://api.looktwice.dev/v1/iban/check \
  --request POST \
  --header "Authorization: Bearer $LOOKTWICE_API_KEY" \
  --header "Content-Type: application/json" \
  --header "Idempotency-Key: iban-example-$(date +%s)" \
  --data '{"iban":"GB82 WEST 1234 5698 7654 32"}'
