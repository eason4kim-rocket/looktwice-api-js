import json
import os
import uuid
import urllib.error
import urllib.request


api_key = os.environ.get("LOOKTWICE_API_KEY")
if not api_key:
    raise RuntimeError("Set LOOKTWICE_API_KEY before running this example")

request = urllib.request.Request(
    "https://api.looktwice.dev/v1/vat/check",
    data=json.dumps({"country_code": "DE", "vat_number": "123456789"}).encode(),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4()),
    },
    method="POST",
)

try:
    with urllib.request.urlopen(request, timeout=15) as response:
        print(json.dumps(json.load(response), indent=2))
except urllib.error.HTTPError as error:
    print(error.read().decode())
    raise
