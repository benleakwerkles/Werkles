# Werkles VPGM — PLAID_SANDBOX_ACTIVATION v0.1

**To Bean** (Hostile audit cousin · DeepSeek · Edge tab 4)
**Issued by:** Heimerdinker@Betsy, Werkles Foreman
**Doctrine:** STOP BEFORE SEND — Foreman prepares and pastes; Ben clicks Send.

## Slice under review

Pre-code review of the smallest truthful Plaid sandbox lifecycle now that sandbox access exists and production credentials are under review.

## Context handed to the cousin

- Werkles uses Plaid only in the Backer lane for a user-initiated, point-in-time minimum-funds check. Public ranking by wealth is forbidden; the intended durable result is a dated narrow pass/fail receipt, not balances or wealth bands.
- Plaid onboarding was completed with Auth + Balance requested. The current local Link request still asks for Assets, and the provider-neutral adapter prototype models Fast Assets creation, signed readiness webhook handling, threshold evaluation, Item/report deletion, and revocation.
- The current live exchange route is deliberately disabled. The browser Link launcher discards the public token and reports completed-not-saved. Link success alone is not funds verification.
- Sandbox is available. Production credentials are pending provider review. No production call, billing change, secret handling, SQL/schema/RLS, push, or deploy is in scope.
- Werkles policy: raw financial and identity evidence is not retained; raw values must not be logged, returned to the browser, used for matching rank, or exposed to other members. Provider access should be removed after the narrow check when technically supported.

## Verbatim member-facing strings

- Funds verified — <date>
- completed-not-saved
- A Plaid window can open here. Finishing it does not save a bank connection or create a funds check yet.

## Known gaps disclosed up front

- Official product-fit evidence is needed for Auth + Balance versus Fast Assets for a one-shot threshold check and disposal lifecycle.
- No sandbox public-token exchange, reusable Item custody, Balance/Assets retrieval, signed webhook endpoint, or durable receipt persistence is currently enabled in the route.
- Production access is pending and must not be implied or exercised.

## Assignment

- **V:** Prevent sandbox plumbing from becoming a wealth-ranking system, a raw-data retention path, or a fake verification badge.
- **P:** Attack both Auth + Balance and Fast Assets against Werkles' narrow claim, zero-raw-data posture, transient token custody, deletion promises, replay/idempotency, cross-member isolation, and partial-cleanup failures.
- **M:** End with the two strongest pre-code conditions and one exact stop condition.
- **Out of lane:** Review only. No form/dashboard action, credentials, provider calls, legal approval, code, SQL, push, deploy, new tasks, subagents, or secondary models.

### G — work items

1. Return GO_FOR_BUILD, PASS_WITH_CONDITIONS, or BLOCK with the minimum invariant set the first sandbox lifecycle must enforce.

2. Attack the exact transition from Link success to server evaluation to dated receipt, including replay, stale evidence, threshold manipulation, Item/report deletion failure, logging, and browser leakage.

3. List the highest-value hostile tests and the member-facing claims that must remain forbidden until production review and durable persistence are complete.

## Expected return

`foreman/handoffs/inbox/FROM_BEAN_PLAID_SANDBOX_ACTIVATION_v0.1.md`
with a filled `## Relay metadata` block. Validate with
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.

## Paste block delivered to the chat tab

```text
[WERKLES VPGM — PLAID_SANDBOX_ACTIVATION v0.1]

Bean (Hostile audit cousin, DeepSeek). Your lane: Trust, compliance, hardening audits — not deploy execution.

CUSTODY_TOKEN: CUSTODY-BEAN-74D522F29F1671F7B77C98868C820F89

This is a real work request from the Werkles Foreman, not a role-sync ping. Everything
you need is in this message — do not ask for repo files.

SLICE UNDER REVIEW
Pre-code review of the smallest truthful Plaid sandbox lifecycle now that sandbox access exists and production credentials are under review.

CONTEXT
- Werkles uses Plaid only in the Backer lane for a user-initiated, point-in-time minimum-funds check. Public ranking by wealth is forbidden; the intended durable result is a dated narrow pass/fail receipt, not balances or wealth bands.
- Plaid onboarding was completed with Auth + Balance requested. The current local Link request still asks for Assets, and the provider-neutral adapter prototype models Fast Assets creation, signed readiness webhook handling, threshold evaluation, Item/report deletion, and revocation.
- The current live exchange route is deliberately disabled. The browser Link launcher discards the public token and reports completed-not-saved. Link success alone is not funds verification.
- Sandbox is available. Production credentials are pending provider review. No production call, billing change, secret handling, SQL/schema/RLS, push, or deploy is in scope.
- Werkles policy: raw financial and identity evidence is not retained; raw values must not be logged, returned to the browser, used for matching rank, or exposed to other members. Provider access should be removed after the narrow check when technically supported.

WHAT THE MEMBER ACTUALLY SEES (verbatim strings)
- Funds verified — <date>
- completed-not-saved
- A Plaid window can open here. Finishing it does not save a bank connection or create a funds check yet.

KNOWN GAPS (already admitted — do not spend your answer rediscovering these)
- Official product-fit evidence is needed for Auth + Balance versus Fast Assets for a one-shot threshold check and disposal lifecycle.
- No sandbox public-token exchange, reusable Item custody, Balance/Assets retrieval, signed webhook endpoint, or durable receipt persistence is currently enabled in the route.
- Production access is pending and must not be implied or exercised.

--- YOUR ASSIGNMENT ---

V (vision): Prevent sandbox plumbing from becoming a wealth-ranking system, a raw-data retention path, or a fake verification badge.

P (pull): Attack both Auth + Balance and Fast Assets against Werkles' narrow claim, zero-raw-data posture, transient token custody, deletion promises, replay/idempotency, cross-member isolation, and partial-cleanup failures.

G (go) — work these, in this order:

1. Return GO_FOR_BUILD, PASS_WITH_CONDITIONS, or BLOCK with the minimum invariant set the first sandbox lifecycle must enforce.

2. Attack the exact transition from Link success to server evaluation to dated receipt, including replay, stale evidence, threshold manipulation, Item/report deletion failure, logging, and browser leakage.

3. List the highest-value hostile tests and the member-facing claims that must remain forbidden until production review and durable persistence are complete.

M (momentum): End with the two strongest pre-code conditions and one exact stop condition.

OUT OF LANE: Review only. No form/dashboard action, credentials, provider calls, legal approval, code, SQL, push, deploy, new tasks, subagents, or secondary models.

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_BEAN_PLAID_SANDBOX_ACTIVATION_v0.1.md

OPEN your reply with this exact block, filled in. It is how the cockpit proves the
packet reached you rather than a composer, a wrong tab, or a stale thread:

RECEIVED
CUSTODY_TOKEN: CUSTODY-BEAN-74D522F29F1671F7B77C98868C820F89
COUSIN: BEAN
PACKET: TO_BEAN_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md
LANE_CHECK: IN_LANE | OUT_OF_LANE — <one line>
BLOCKER: NONE | <exact>

End your reply with this exact block, filled in:

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "custody_token": "CUSTODY-BEAN-74D522F29F1671F7B77C98868C820F89",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "TO_BEAN_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658",
  "source_packet_file": "TO_BEAN_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md",
  "nextActionHash": "ddf58113ef50c4a72a8a602058677ed57032dd1ffcd4fa1f22db53e68a6474fe",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a"
}
```

Do not recommend deploy, push, SQL apply, secret entry, or spending money. Those are
Operator gates. Say what you would do and stop.

```

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "BEAN",
  "generated_at": "2026-08-22T06:58:09.097Z",
  "currentStateHash": "78e580fb3019107585768920e8d2f5fc289e6533f4b1716081bea719d772242a",
  "nextActionHash": "ddf58113ef50c4a72a8a602058677ed57032dd1ffcd4fa1f22db53e68a6474fe",
  "source_files_included": [
    "foreman/NEXT_ACTION.md",
    "foreman/CURRENT_STATE.md"
  ],
  "REQUIRED_RESPONSE_FIELDS": [
    "schemaVersion",
    "cousin",
    "source_packet_id",
    "source_packet_file",
    "generated_at",
    "nextActionHash",
    "CONFIDENCE",
    "VERDICT",
    "UNKNOWNS"
  ],
  "custody_token": "CUSTODY-BEAN-74D522F29F1671F7B77C98868C820F89",
  "packet_id": "TO_BEAN_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658",
  "source_packet_file": "TO_BEAN_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md",
  "network_command": "PLAID_SANDBOX_ACTIVATION",
  "network_command_version": "v0.1",
  "role_lane": "Trust, compliance, hardening audits — not deploy execution.",
  "human_gate_required": true,
  "edge_tab_index": 4,
  "edge_url": "https://chat.deepseek.com/"
}
```

