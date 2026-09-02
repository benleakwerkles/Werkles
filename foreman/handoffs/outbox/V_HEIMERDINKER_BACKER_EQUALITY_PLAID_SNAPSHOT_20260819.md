# Vision — Backer equality + Plaid snapshot

Date: 2026-08-19  
Foreman: Heimerdinker / Dink  
Lane: Werkles matching + Crucible trust  
Environment: Betsy localhost / local repo only

## Vision

Werkles introduces people before it compares resources. Interests, temperament, personality, goals, working style, and complementary needs shape human fit. Money becomes relevant only after mutual interest reaches a concrete financial claim.

Plaid may establish that a member qualified for the Backer lane or met a specific opportunity threshold at a stated time. It must never establish social rank, comparative worth, wisdom, or match priority.

## Product law

1. Money is eligibility for a commitment, not prestige.
2. Raw balance, net worth, excess above threshold, and wealth bands never enter match scoring.
3. A qualifying result is private, narrow, dated, expiring, purpose-bound, and consented.
4. Clearing a threshold produces no search boost, queue priority, special badge, or broader entrepreneur access.
5. A $10M member and a $1M member who both satisfy the same opportunity requirement are equal on that financial dimension.
6. Plaid completion alone proves nothing; only a reviewed receipt may establish the narrow claim.
7. No current UI may imply live funds proof: exchange, custody, Balance/Assets retrieval, and persistence remain disabled.

## Proposed bounded build

- Add one pure, exhaustive Backer-equality policy contract.
- Add plain-language member copy to Funds/Crucible and Intros explaining sequencing and non-ranking.
- Add regression contracts proving current Ghost matching uses only the binary `can_back` posture and imports no balance/net-worth/funds-proof values.
- Preserve all provider, schema, authentication, and production gates.

## Hard edges

No Plaid call, token exchange, access-token custody, raw balance, Asset Report, schema/RLS, privacy-policy ratification, provider account action, secret, spend, staging, push, deploy, or production mutation. No subagents or new execution environments.

## Stop condition

Exact actual Bean and Ender reviews must return before product code changes. Outgoing packets and automated tests do not count as reviews. Tonight's push remains a separate three-key gate requiring Heimerdinker, Lady Jessica, and Ben; Lady Jessica alone executes.
