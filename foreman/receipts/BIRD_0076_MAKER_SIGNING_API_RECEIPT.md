# BIRD_0076_MAKER_SIGNING_API_RECEIPT

Receipt_ID: BIRD_0076_MAKER_SIGNING_API_RECEIPT
Packet_ID: BIRD_0076_MAKER_SIGNING_API
Status: ARTIFACT
Created_At: 2026-06-27T17:26:27-04:00
Artifact_Path: tinkarden/server/index.js

## Summary

Added `GET /v1/action/staged/:id` to the local Fastify backend.

The route reads `shadow_cache.payload_json` by `shadow_id` and returns only the deterministic staged payload as minified JSON. It excludes `shadow_id`, timestamps, action type, mock diff, receipts, and server metadata from the signing payload.

Missing or cleared staged IDs return `404` with `NOT_FOUND`.

## Route Definition

```javascript
app.get("/v1/action/staged/:id", async (request, reply) => {
  const shadowId = text(request.params.id);
  const shadow = db.prepare("SELECT payload_json FROM shadow_cache WHERE shadow_id = ?").get(shadowId);

  if (!shadow) {
    return reply.code(404).send({ ok: false, error: "NOT_FOUND" });
  }

  return reply
    .type("application/json")
    .send(JSON.stringify(JSON.parse(shadow.payload_json)));
});
```

## cURL Proof

```text
shadow_id=shadow_20260627212627_dcb07097
staged_payload={"outcome":"DEPRECATE","reason":"BIRD_0076 staged signing endpoint proof","doctrine_path":"speaker/doctrine/active/BIRD_0076_SIGNING_API_PROBE.md","operator_approval_receipt_id":"BIRD_0076_OPERATOR_APPROVAL_PROBE"}
missing_status=404
```

## Verification

- `ReadLints` reported no linter errors for `tinkarden/server/index.js`.
- The updated Fastify backend was restarted on `127.0.0.1:4317`.
- The successful cURL response contains raw minified JSON only, ready for GPG signing.
