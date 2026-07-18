# Flock Packet — Member Commerce Language Boundary VPG17

Status: `OPEN`
Machine: `Betsy`
Execution/push owner: Heimerdinker / Dink@Betsy
Review seats: Doozer@Betsy, Thufir@Betsy, and Bean@Betsy
Repository: `benleakwerkles/Werkles`
Starting source: `234f25f71efbeb6e1945729ea938573b3c13dad8`

## Mission

Keep Membership and Pricing warm, concise, and customer-facing while preserving every real checkout, payment, and guarantee boundary.

## VPG PREPARE — read-only pull

Inspect Membership, Pricing, current payment-state logic, the public plan explanation, and the internal route boundary. Return exactly two bounded changes that remove operator/test plumbing and repeated payment-state prose without implying checkout is available when it is not.

Heimerdinker owns all edits, verification, commits, pushes, localhost hands, and any future Preview hands.

## VPG GO boundary

- Remove public links or imports from Membership/Pricing to `/operator`, runbooks, gate matrices, source identifiers, and setup vocabulary.
- Keep checkout-state logic fail-closed, visible, and accurate; do not enable payments or change API/provider behavior.
- Preserve prices, plan comparison, free path, guarantee disclaimer, human gate, and live-money boundary.
- Prefer one concise availability message over multiple repeated sections.
- Do not change Stripe, secrets, environment variables, billing persistence, provider configuration, or protected operator routes.
- No browser/cursor control, manual deploy, Production action, PR, SQL/schema/RLS, persistence, LLM enablement, provider call, member-data read, or external delivery. The approved isolated branch push may create the repository's configured protected Git Preview; do not promote or alias it.

## Acceptance

- Membership and Pricing contain no operator runbook link, operator-setup wording, test-key wording, or internal pricing-source identifier.
- Paused checkout remains visibly paused, with the free path still available.
- The page does not render two separate paused-payment explanations.
- A focused regression guards both customer-language cleanliness and the unchanged payment/trust boundaries.
