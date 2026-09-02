# Werkles VPGM — PLAID_SANDBOX_ACTIVATION v0.1

**To Ender** (Product / UX cousin · Claude · Edge tab 3)
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

- **V:** Make the sandbox walkthrough feel like a real, understandable product step without pretending a test-bank exercise verified real money.
- **P:** Review the current completed-not-saved state and the intended dated receipt. Design the smallest human flow for opening Link, selecting a sandbox account, seeing what was tested, and understanding what remains pending.
- **M:** Return UX_READY_WITH_COPY or BLOCKED, plus the two strongest visual/interaction requirements.
- **Out of lane:** No code, provider calls, dashboard action, security audit, legal approval, secrets, SQL, push, deploy, new tasks, subagents, or secondary models.

### G — work items

1. Return a five-state member flow with concise copy for ready, Link open, evaluating, sandbox result, and cleanup/failure.

2. Separate operator/testing language from eventual member language and flag every robotic, insider, or misleading phrase.

3. Specify what the Crucible card should show after a successful sandbox threshold check and what it must never call verified.

## Expected return

`foreman/handoffs/inbox/FROM_ENDER_PLAID_SANDBOX_ACTIVATION_v0.1.md`
with a filled `## Relay metadata` block. Validate with
`node foreman/crew-dispatch/crew-response-intake.mjs validate`.

## Paste block delivered to the chat tab

```text
[WERKLES VPGM — PLAID_SANDBOX_ACTIVATION v0.1]

Ender (Product / UX cousin, Claude). Your lane: UX, brand voice, design system — not SQL, billing, security, or deploy execution.

CUSTODY_TOKEN: CUSTODY-ENDER-B4B0A327B9E24C2CEFB7191770326E53

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

V (vision): Make the sandbox walkthrough feel like a real, understandable product step without pretending a test-bank exercise verified real money.

P (pull): Review the current completed-not-saved state and the intended dated receipt. Design the smallest human flow for opening Link, selecting a sandbox account, seeing what was tested, and understanding what remains pending.

G (go) — work these, in this order:

1. Return a five-state member flow with concise copy for ready, Link open, evaluating, sandbox result, and cleanup/failure.

2. Separate operator/testing language from eventual member language and flag every robotic, insider, or misleading phrase.

3. Specify what the Crucible card should show after a successful sandbox threshold check and what it must never call verified.

M (momentum): Return UX_READY_WITH_COPY or BLOCKED, plus the two strongest visual/interaction requirements.

OUT OF LANE: No code, provider calls, dashboard action, security audit, legal approval, secrets, SQL, push, deploy, new tasks, subagents, or secondary models.

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_ENDER_PLAID_SANDBOX_ACTIVATION_v0.1.md

OPEN your reply with this exact block, filled in. It is how the cockpit proves the
packet reached you rather than a composer, a wrong tab, or a stale thread:

RECEIVED
CUSTODY_TOKEN: CUSTODY-ENDER-B4B0A327B9E24C2CEFB7191770326E53
COUSIN: ENDER
PACKET: TO_ENDER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md
LANE_CHECK: IN_LANE | OUT_OF_LANE — <one line>
BLOCKER: NONE | <exact>

End your reply with this exact block, filled in:

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "ENDER",
  "custody_token": "CUSTODY-ENDER-B4B0A327B9E24C2CEFB7191770326E53",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "TO_ENDER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658",
  "source_packet_file": "TO_ENDER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md",
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
  "cousin": "ENDER",
  "generated_at": "2026-08-22T06:58:09.098Z",
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
  "custody_token": "CUSTODY-ENDER-B4B0A327B9E24C2CEFB7191770326E53",
  "packet_id": "TO_ENDER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658",
  "source_packet_file": "TO_ENDER_VPGM_PLAID_SANDBOX_ACTIVATION_v0.1_20260822-0658.md",
  "network_command": "PLAID_SANDBOX_ACTIVATION",
  "network_command_version": "v0.1",
  "role_lane": "UX, brand voice, design system — not SQL, billing, security, or deploy execution.",
  "human_gate_required": true,
  "edge_tab_index": 3,
  "edge_url": "https://claude.ai/"
}
```

