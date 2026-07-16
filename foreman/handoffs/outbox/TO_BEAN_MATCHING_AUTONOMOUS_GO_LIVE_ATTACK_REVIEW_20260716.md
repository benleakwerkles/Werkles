# TO BEAN — Matching Autonomous Go-Live Attack Review

Packet: `TO_BEAN_MATCHING_AUTONOMOUS_GO_LIVE_ATTACK_REVIEW_20260716`  
Owner: DeepSeek Bean  
Requested by: Ben (Operator)  
Prepared by: Heimerdinker on Betsy  
Date: 2026-07-16  
Mode: hostile review only

## Mission

Attack the prepared Matching Autonomous Go-Live gate as if Werkles were about to ship an unsafe or misleading product claim. Find the shortest paths to user harm, regulatory trouble, false confidence, bad recommendations, data-rights failures, and operational incidents.

## Source artifacts

- `foreman/platform-instructions/DEEPSEEK_BEAN_INSTRUCTIONS.md`
- `foreman/reviews/GATE-matching-autonomous-go-live-20260716.md`
- `foreman/reviews/WERKLES_MATCHING_DATA_POLICY_DECISION_V0_20260711.md`
- `foreman/receipts/WERKLES_MATCHING_READOUT_REDEPLOY_20260716.md`
- `foreman/NEXT_ACTION.md`
- `lib/matching/**`
- public discovery/bellows intake and recommendation surfaces

## Mandatory attacks

- policy/gate contradiction: policy says not approved; gate describes it as approved
- launch prerequisite violation: export/deletion handling required before public matching but missing
- three golden paths presented as evidence for a broad public system
- member-facing label change from shadow to autonomous without an algorithm change
- capital, job-change, training, partner, and other recommendation domains crossing different harm/legal boundaries
- unverified or stale data presented with excessive confidence
- missing appeal, correction, explanation, feedback, monitoring, incident, rollback, and kill-switch UX
- privacy and retention failures when free-text intake contains employment, financial, identity, or situational details

## Required output

Write:

`foreman/reviews/BEAN_MATCHING_AUTONOMOUS_GO_LIVE_ATTACK_REVIEW_20260716.md`

Use Bean format:

- Remaining findings
- Exploit path
- Damage if shipped
- Required fix
- Retest instruction
- `VERDICT: GO / CONDITIONAL GO / NO-GO`

Rank findings by severity and separate proven defects from unknowns.

## Boundaries

No product edits, flag flip, deploy, push, merge, SQL, external attack traffic, secret access, production data read, external communication, or production mutation.
