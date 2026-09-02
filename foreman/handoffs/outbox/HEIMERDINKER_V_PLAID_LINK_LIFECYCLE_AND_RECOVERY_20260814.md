# Heimerdinker V — Plaid Link lifecycle and recovery

Date: 2026-08-14

Owner: Heimerdinker / Dink, Werkles.com Foreman

Execution context: `CODEX_LOCAL` on Betsy

Lane: Werkles.com / Crucible Plaid sandbox integration

Status: local implementation and review; no production authority

## Vision

The customized Plaid request is wired. Now make the handoff understandable and recoverable. A member should know whether Link is loading, open, closed by them, failed safely, or completed without being saved. Werkles must gain this clarity without accepting or exposing Plaid tokens, metadata, institution/account details, or provider error payloads.

## P — current state

- Published customization `default` is explicitly requested.
- Link launch is single-flight and swallows the public token.
- The launcher understands only success and undifferentiated exit.
- The page status line cannot distinguish script loading, Link open, safe exit, provider-side failure, or completion-not-saved.
- Public-token exchange, Item custody, and funds proof remain disabled.
- Fresh named CBCC experience/trust returns are still waiting.
- Live sandbox token compatibility proof remains blocked at Betsy's 1Password unlock.

## G idea 1 — sanitized Link lifecycle contract

- Define a closed, provider-neutral client lifecycle: loading, open, exited, failed, completed-not-saved.
- Accept Plaid SDK callbacks only at the launcher boundary.
- Convert them to narrow internal events without forwarding raw error objects, metadata, institution/account fields, request IDs, tokens, or public tokens.
- Keep single-flight behavior and make every terminal path release the launch lock exactly once.
- Fail closed on malformed callbacks and unavailable script/SDK.

## G idea 2 — warm recovery/status experience

- Map the narrow lifecycle to short, human copy in the existing live status region.
- Explain completed-not-saved plainly.
- Explain a member-initiated close without scolding or implying failure.
- Explain provider/configuration failure without code words or fake retry success.
- Keep the Funds card/action usable after any terminal outcome.
- Add focused offline and local-render contracts; avoid a new page or large redesign.

## Momentum

1. independently attack raw metadata/token leakage, spoofed callback ordering, duplicate terminal events, unresolved promises, single-flight lock leaks, and misleading copy;
2. run the full Plaid/Crucible contract suite, typecheck, build, and local rendered inspection;
3. re-pull CBCC packets and write a receipt.

## Hard edges

No 1Password retries, provider call, Dashboard mutation, public-token exchange, Item custody, Balance/Assets retrieval, proof badge, telemetry persistence, SQL/schema/RLS, secrets, environment changes, paid call, staging, commit, push, deploy, or public launch. Preserve the dirty shared tree. Named CBCC seats are not simulated by local workers.
