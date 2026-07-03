# BIRD_0104_MAKER_UNRESTRICTED_HOOK_RECEIPT

Receipt_ID: BIRD_0104_MAKER_UNRESTRICTED_HOOK_RECEIPT
Packet_ID: BIRD_0104_MAKER_UNRESTRICTED_HOOK
Status: ARTIFACT
Created_At: 2026-06-27T18:11:25-04:00
Artifact_Path: tinkarden/server/index.js

## Summary

Added `GET /v1/reports/raw/:filename` to the local Fastify backend.

The route returns exact staged report plaintext from `speaker/receipts/staged/*` with `Content-Type: text/plain; charset=utf-8`. The server already applies permissive local CORS headers globally, including `Access-Control-Allow-Origin: *`, so the Feral UI on port `3339` can read the plaintext response.

The route is direct and unformatted, while still resolving the request as a filename inside the requested staged receipt bay.

## Raw Fastify Route Definition

```javascript
const SPEAKER_STAGED_RECEIPTS_DIR = path.join(SPEAKER_ROOT, "receipts", "staged");

app.get("/v1/reports/raw/:filename", async (request, reply) => {
  const filename = text(request.params.filename);
  const reportPath = path.join(SPEAKER_STAGED_RECEIPTS_DIR, path.basename(filename));

  if (!filename || !fs.existsSync(reportPath) || !fs.statSync(reportPath).isFile()) {
    return reply.code(404).type("text/plain").send("NOT_FOUND");
  }

  const plaintext = await readFile(reportPath, "utf8");
  return reply.type("text/plain; charset=utf-8").send(plaintext);
});
```

## cURL Proof

Probe file:

```text
speaker/receipts/staged/BIRD_0104_RAW_REPORT_PROBE.txt
```

Response body:

```text
BIRD_0104 raw staged report probe
origin: Maker@Betsy
target: speaker/receipts/staged/BIRD_0104_RAW_REPORT_PROBE.txt
awaiting: plaintext copy access
```

Response headers:

```text
HTTP/1.1 200 OK
access-control-allow-origin: *
access-control-allow-methods: GET,POST,OPTIONS
access-control-allow-headers: Content-Type
access-control-allow-private-network: true
content-type: text/plain; charset=utf-8
content-length: 153
```

Missing file proof:

```text
GET /v1/reports/raw/DOES_NOT_EXIST.txt
missing_status=404
```

## Verification

```text
node --check tinkarden/server/index.js
server syntax ok

ReadLints
No linter errors found.

Fastify backend restarted on http://127.0.0.1:4317.
```
