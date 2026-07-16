# Tier 1 Gate — Matching Readout Rename Redeploy

Status: `APPROVED` — Operator phrase: `Approve redeploy`  
Date: 2026-07-16  
Branch: `maker/site-g-20260703`  
Confidence: `HIGH`

## Decision

Redeploy werkles.com production with Matching readout rename + member causal draft (no public flip).

```text
Approve redeploy
```

## Scope

- Rename matching packaging `Speaker*` → `MatchingReadout` / `readout`
- Add `memberCausalDraft` (real Speaker office shape for member journey)
- Doctrine: V1 charter rejected; `WERKLES_MEMBER_CAUSAL_SPEAKER_USE_V0.md`
- Legacy payload normalize: `speaker` → `readout` on read

## Hard stops preserved

- Public matching OFF
- LLM matching OFF
- No SQL/schema change
- No Production env mutation required (`MATCHING_STORAGE_MODE` already `supabase`)
- Unrelated dirty-tree files excluded from commit/deploy

## Mechanical sequence

1. Record approval in `APPROVAL_LOG.md`
2. Commit + push isolated matching/doctrine slice
3. Deploy from clean worktree: `vercel deploy --prod --yes`
4. Live smoke: `Test-WerklesMatchingShadowSmoke.ps1` → `https://werkles.com`
5. Receipt: `foreman/receipts/WERKLES_MATCHING_READOUT_REDEPLOY_20260716.md`
