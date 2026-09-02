# Werkles VPGM — PLAID_SANDBOX_ACTIVATION v0.1

**To Computer** (Doctrine / research cousin · Perplexity · Edge tab 5)
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

- **V:** Establish the official Plaid product and lifecycle facts that decide whether Werkles should use Auth + Balance, Fast Assets, or a staged experiment for its narrow threshold claim.
- **P:** Use current official Plaid documentation only. Resolve Link products, API calls, webhooks, sandbox mechanics, pricing-relevant call shape if publicly documented, and exact Item/report deletion behavior.
- **M:** Return PRODUCT_FIT_READY, STAGED_EXPERIMENT_REQUIRED, or BLOCKED_PLAID_CLARIFICATION with links to official Plaid sources.
- **Out of lane:** No dashboard mutation, provider submission, secret handling, paid call, code, SQL, push, deploy, new task, subagent, or secondary model.

### G — work items

1. Return a decision table comparing Auth + Balance and Fast Assets for one user-initiated point-in-time minimum-funds threshold, including data exposed, completion authority, latency, deletion/revocation, and whether a reusable Item is required.

2. Name the smallest sandbox experiment that can falsify the preferred choice without storing raw values or printing secrets, with exact official endpoints/webhooks and cleanup calls.

3. Identify any question that still requires Sophia/Plaid rather than local inference.

## Expected return

`foreman/handoffs/inbox/FROM_COMPUTER_PLAID_SANDBOX_ACTIVATION_v0.1.md`
with a filled `## Relay metadata` block. Validate with
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.

## Paste block delivered to the chat tab

```text
[WERKLES VPGM — PLAID_SANDBOX_ACTIVATION v0.1]

Computer (Doctrine / research cousin, Perplexity). Your lane: Synthesis, current-world checks, cited research — not unsourced deploy decisions.

CUSTODY_TOKEN: CUSTODY-COMPUTER-691A6A091E3620495F4EC2CC67E7992D

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

V (vision): Establish the official Plaid product and lifecycle facts that decide whether Werkles should use Auth + Balance, Fast Assets, or a staged experiment for its narrow threshold claim.

P (pull): Use current official Plaid documentation only. Resolve Link products, API calls, webhooks, sandbox mechanics, pricing-relevant call shape if publicly documented, and exact Item/report deletion behavior.

G (go) — work these, in this order:

1. Return a decision table comparing Auth + Balance and Fast Assets for one user-initiated point-in-time minimum-funds threshold, including data exposed, completion authority, latency, deletion/revocation, and whether a reusable Item is required.

2. Name the smallest sandbox experiment that can falsify the preferred choice without storing raw values or printing secrets, with exact official endpoints/webhooks and cleanup calls.

3. Identify any question that still requires Sophia/Plaid rather than local inference.

M (momentum): Return PRODUCT_FIT_READY, STAGED_EXPERIMENT_REQUIRED, or BLOCKED_PLAID_CLARIFICATION with links to official Plaid sources.

OUT OF LANE: No dashboard mutation, provider submission, secret handling, paid call, code, SQL, push, deploy, new task, subagent, or secondary model.

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_COMPUTER_PLAID_SANDBOX_ACTIVATION_v0.1.md

OPEN your reply with this exact block, filled in. It is how the cockpit proves the
packet reached you rather than a composer, a wrong tab, or a stale thread:

RECEIVED
CUSTODY_TOKEN: CUSTODY-COMPUTER-691A6A091E3620495F4EC2CC67E7992D
COUSIN: COMPUTER
PACKET: TO_COMPUTER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md
LANE_CHECK: IN_LANE | OUT_OF_LANE — <one line>
BLOCKER: NONE | <exact>

End your reply with this exact block, filled in:

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "COMPUTER",
  "custody_token": "CUSTODY-COMPUTER-691A6A091E3620495F4EC2CC67E7992D",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "TO_COMPUTER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658",
  "source_packet_file": "TO_COMPUTER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md",
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
  "cousin": "COMPUTER",
  "generated_at": "2026-08-22T06:58:09.096Z",
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
  "custody_token": "CUSTODY-COMPUTER-691A6A091E3620495F4EC2CC67E7992D",
  "packet_id": "TO_COMPUTER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658",
  "source_packet_file": "TO_COMPUTER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md",
  "network_command": "PLAID_SANDBOX_ACTIVATION",
  "network_command_version": "v0.1",
  "role_lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "human_gate_required": true,
  "edge_tab_index": 5,
  "edge_url": "https://www.perplexity.ai/"
}
```

