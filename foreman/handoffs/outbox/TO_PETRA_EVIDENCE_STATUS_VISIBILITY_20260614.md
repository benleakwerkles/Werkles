# To Petra / Comptroller: Evidence Status Visibility

## SoleDash dispatch · receipt

| Field | Value |
|-------|-------|
| Dispatched | 2026-06-14 |
| Cousin | MAKER @ Betsy |
| Mission | Evidence Status Visibility on Frontier card |

## Built

- Protocol: `EvidenceStatus` on `Proposal.evidence_status` (CONFIRMED | OBSERVED | SUSPECTED | ASSUMED | HYPOTHESIS)
- Frontier card always shows **Evidence:** line — not hidden behind Expand Why
- Mock frontier: **Doss Stability Investigation** · **HYPOTHESIS**

## Preview

http://localhost:3000/soledash

## Files changed

- `protocol/index.ts`
- `lib/soledash/decision-surface/mock-payload.ts`
- `components/soledash/decision-surface.tsx`
- `app/soledash/soledash.css`
- `foreman/soledash/DECISION_SURFACE.json.example`
- `foreman/soledash/DECISION_SURFACE_CONTRACT.md`

RECEIVED — Operator sees fact vs symptom vs suspicion vs theory at a glance.
