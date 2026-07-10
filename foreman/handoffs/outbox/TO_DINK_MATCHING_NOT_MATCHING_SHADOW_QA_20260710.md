# TO DINK — Matching / Not-Matching Shadow QA

| Field | Value |
|-------|-------|
| **Packet** | `TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710` |
| **Dispatched** | 2026-07-10 |
| **From** | Lady Jessica (Maker@Betsy) |
| **To** | Direwolf Dink@Betsy |
| **Lane** | Werkles.com / G only — **not Harvey** |
| **Mission class** | LOCAL_BUILD + MECHANICAL_PROOF |
| **Pairs with** | Maker (engine tuning + public UI) |

---

## Mission

Prove the **autonomous matching / not-matching shadow engine** works end-to-end on werkles.com (or local preview if deploy blocked). You run intakes, review shadow output, file a receipt. Maker tunes rules from your false-positive report.

**This is not people matching.** Engine scores **path types** (verify proof, find CU, find partner, etc.) after Layer 0 translation and not-match guards.

---

## LOCAL HANDS READBACK (mandatory first)

Per `foreman/EXECUTION_CONTEXT_RULES.md` — deliver before any edits, deploy, push, or package install:

```text
LOCAL HANDS READBACK
Machine: <hostname>
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: <git rev-parse --short HEAD>
Working tree: <clean | dirty summary>
Terminal: available
Localhost: <running | not running>
Port: <3000 | none>
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

**Canonical repo:** `C:\Users\Ben Leak\github\Werkles` — not Desktop clone.

---

## Git / deploy context

| Field | Value |
|-------|-------|
| Branch | `maker/site-g-20260703` |
| Matching commit | `8e77ace` — Layer 0 + not-match engine |
| Remote | `origin/maker/site-g-20260703` (pushed) |
| Deploy | **Confirm werkles.com has this branch** — deploy via Vercel if Operator approves |

If production is behind branch, note in receipt before blaming engine.

---

## Architecture (what you are testing)

```
Intake POST → signals → Layer 0 → not-match → path score → Speaker card → Squibb voice → shadow-runs.jsonl
```

| Flag | Value |
|------|-------|
| `MATCHING_AUTONOMOUS_SHADOW` | **true** |
| `MATCHING_AUTONOMOUS_PUBLIC` | **false** (shadow mode) |

---

## Your tasks (in order)

### 1. Confirm deploy

- Hit `https://werkles.com/operator/matching/shadow` — should show **Autonomous matching / Shadow runs**
- If 404 or old copy: deploy `maker/site-g-20260703` (Operator gate for production deploy)

### 2. Run smoke mule

```powershell
cd C:\Users\Ben Leak\github\Werkles
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1
# Local preview instead:
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "http://localhost:3000"
```

Posts **three discovery intakes**:

| Scenario | What we expect not-match / Layer 0 to catch |
|----------|-----------------------------------------------|
| Capital + partner | Proof before people/money; partner may be symptom |
| Job change | Employment path ranks; not investor path |
| Training vs partner | Training or intrinsic leverage; suppress blind partner match |

Receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_YYYYMMDD.json`

### 3. Human review (required — smoke alone is not enough)

Open `/operator/matching/shadow` and for each run record:

- Stated need vs **translated** need (Layer 0)
- **Not-match outcome** (`proceed` | `pause` | `proof_only`)
- Top path + score — does it feel right?
- **False positive** — engine recommended wrong path
- **False negative** — engine missed obvious path
- **Missing silence** — should have paused and did not

### 4. Optional: Bellows concierge intake

Submit one intake at `https://werkles.com/bellows/intake` — confirm shadow run appears and `/bellows/recommendations` reflects it.

### 5. File QA receipt

Create: `foreman/receipts/WERKLES_MATCHING_SHADOW_QA_YYYYMMDD.md`

Template:

```markdown
# Matching Shadow QA — YYYY-MM-DD
Machine: BETSY
Site: https://werkles.com (or local)
Deploy commit: <hash if known>

## Smoke mule
OVERALL: PASS | FAIL
Link: foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_*.json

## Per-scenario review
### 1. Capital + partner
- shadow_run_id:
- Layer 0 translated need:
- Not-match:
- Top path:
- Verdict: GOOD | TUNE | BROKEN
- Notes:

(repeat for job, training)

## False positives for Maker
- 

## False negatives for Maker
- 

## Blockers
- 

## Recommend public flip?
- YES | NO | NOT YET — reason
```

### 6. Reply RECEIVED

Drop one line in `foreman/handoffs/inbox/`:

```text
RECEIVED: TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710 — <PASS|PARTIAL|BLOCKED> — receipt: foreman/receipts/...
```

---

## Maker owns (do not duplicate)

- `lib/matching/*` rule tuning from your false-positive list
- Public recommendation card UI on `/bellows/recommendations`
- Discovery → recommendations wiring for discovery-sourced shadow runs
- Gate registration in `product-human-gates.ts`
- Speaker Charter V1 ratification copy (Operator gate)

---

## Key paths

| What | Path |
|------|------|
| Engine | `lib/matching/` |
| Doctrine | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| Dossier | `artifacts/matching-inbox/WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md` |
| Operator review | `/operator/matching/shadow` |
| Intake APIs | `/api/discovery/intake`, `/api/bellows/intake` |
| Smoke script | `scripts/foreman/Test-WerklesMatchingShadowSmoke.ps1` |

---

## Hard stops

- **No Harvey** — Werkles.com only (`foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md`)
- No git push / merge without Operator approval
- No production deploy without Operator approval
- No SQL / schema apply
- No secrets in chat or commits
- Do **not** flip `MATCHING_AUTONOMOUS_PUBLIC` — Operator gate: `APPROVE MATCHING AUTONOMOUS GO-LIVE`
- Do **not** ratify Speaker Charter V1 for Ben

Authority: `foreman/HUMAN_GATES.md` → `foreman/LANES.md` → `foreman/BUDGET.md`

---

## Success criteria

| Check | Pass |
|-------|------|
| Smoke mule | 3/3 intakes return `shadow_run_id` |
| Operator page | Lists runs with Layer 0 + not-match + card |
| QA receipt | Filed with per-scenario verdicts |
| False positives | Listed for Maker (even if all GOOD) |

---

## After your receipt

Maker will:

1. Tune `layer0.ts`, `not-match.ts`, `score-paths.ts` from your notes
2. Ship public recommendation card when shadow quality is acceptable
3. Prepare Operator for V1 ratification + public flip gates

---

*Lady Jessica · Maker@Betsy · Werkles.com G lane*
