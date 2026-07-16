# Tier 1 Gate — Matching Autonomous Go-Live (Public Flip)

**Status:** `APPROVED` — Operator phrase recorded 2026-07-16  
**Date:** 2026-07-16  
**Branch:** `maker/site-g-20260703`  
**Confidence:** `MEDIUM`  
**Prepared by:** Maker (Cursor)

Operator approval (exact chat):

```text
P, G. Autonomous Matching (reverse the name) i sapproved/Go
```

Interpreted as: **APPROVE MATCHING AUTONOMOUS GO-LIVE**, with public product name **Autonomous Matching** (not “Matching Autonomous”). API mode: `autonomous_matching`.

---

## Decision (historical)

Flip matching from shadow-labeled delivery to public Autonomous Matching on werkles.com?

```text
APPROVE MATCHING AUTONOMOUS GO-LIVE
```

Until approved: **do not** set `MATCHING_AUTONOMOUS_PUBLIC = true`, deploy that flip, or change member-facing matching claims.

---

## What “public” actually changes

Code flag: `lib/matching/feature-flags.ts` → `MATCHING_AUTONOMOUS_PUBLIC`

| Surface | Today (OFF) | After flip (ON) |
|---------|-------------|-----------------|
| Engine on intake | Runs (shadow) | Still runs |
| Durable Supabase writes | Yes | Yes (same) |
| Intake API `matching_mode` | `"shadow"` | `"autonomous"` |
| Intake API `meaning` | Operator-review framing | Engine-ready framing (Matching readout + Squibb) |
| Bellows recommendation session | Already can load latest shadow run | Same path; public flag true |
| LLM translation | OFF (separate gate) | Still OFF unless separately approved |
| `/operator/matching/shadow` on production | 404 denied | Still 404 denied |

This is **messaging + public-mode labeling**, not a new matcher. It tells members the engine result is the product path, not “operator review first.”

---

## Pre-flight evidence (already proven)

| Check | Result | Evidence |
|-------|--------|----------|
| Shadow production deploy | PASS | `WERKLES_MATCHING_PRODUCTION_DEPLOY_20260713.md` |
| Readout rename redeploy | PASS | `WERKLES_MATCHING_READOUT_REDEPLOY_20260716.md` |
| Golden paths (3) on production | PASS | capital_partner / job_change / training_not_partner |
| Durable storage | `supabase` | Production env present |
| Speaker packaging conflation | Fixed | Matching readout rename; V1 rejected |
| Stale “Speaker facts” intake copy | Patched locally (pre-flip) | discovery + bellows intake routes |

---

## Confidence justification

**MEDIUM** (not HIGH) because:

1. Data policy V0 (approved) said authenticated **member export + deletion-request handling before public matching** — automation/surfaces for that are **not built** yet.
2. Only three golden semantic scenarios are proven; no broad live-traffic quality sample.
3. Recommendation UI may already surface shadow-derived decks in some bellows paths while API still says “shadow” — flip reduces that inconsistency but also raises public claim strength.

---

## Blast radius

- Member-facing copy on discovery/bellows intake success claims autonomous matching
- Liability posture: product may claim “based on what you shared / scored paths,” must **not** claim verified partners or guaranteed matches (Matching readout + Squibb rules)
- No schema change; no SQL; no LLM spend
- Rollback: set flag `false`, redeploy prior commit

---

## Files that would change if approved

| File | Change |
|------|--------|
| `lib/matching/feature-flags.ts` | `MATCHING_AUTONOMOUS_PUBLIC = true` |
| Intake routes (copy) | Already using Matching readout wording (land with flip commit) |
| Deploy | Clean worktree `vercel deploy --prod` of flip commit |
| `APPROVAL_LOG` / receipt | Record + smoke |

---

## What remains blocked after go-live

| Gate | Status |
|------|--------|
| `APPROVE MATCHING LLM TRANSLATE` | Still blocked |
| Retention/deletion automation | Still blocked (policy approved; job not built) |
| Member export/deletion UX | Still not built — **open residual risk** |
| Stripe live / FCRA | Unrelated; still blocked |

---

## Approval phrases

**Approve:**
```text
APPROVE MATCHING AUTONOMOUS GO-LIVE
```

**Approve with conditions (example):**
```text
APPROVE MATCHING AUTONOMOUS GO-LIVE WITH CONDITIONS: <conditions>
```

**Reject:**
```text
REJECT MATCHING AUTONOMOUS GO-LIVE
```

**Patch:**
```text
PATCH MATCHING AUTONOMOUS GO-LIVE: <instructions>
```

---

## Recommended Operator read

If you want deletion/export before any public claim: **reject or patch** and order that work first.  
If you accept residual privacy/ops risk with shadow-proven scoring and OFF LLM: approve, then we flip flag + redeploy + smoke only.
