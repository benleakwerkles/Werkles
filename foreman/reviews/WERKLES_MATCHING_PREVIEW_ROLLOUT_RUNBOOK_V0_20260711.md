# Werkles Matching — Preview Rollout & Rollback Runbook v0

Status: `DRAFT — DO NOT EXECUTE UNTIL SCHEMA GATE APPROVED`  
Lane: Werkles.com / G (matching shadow only)  
Branch: `maker/site-g-20260703`  
Prepared: 2026-07-11 (VPG8)  
Parent gates: `GATE-matching-shadow-production-path-20260710` (Option B) → `GATE-matching-durable-schema-apply-20260710`

---

## Purpose

Mechanical checklist for deploying the matching shadow lane to a **Vercel preview** with **durable Supabase custody**, proving live intake → shadow → operator readback, then stopping before any production promotion or public matching flip.

This runbook does **not** authorize production deploy, SQL apply, secret entry, or flag changes by itself.

---

## Scope boundary

| In scope | Out of scope |
|----------|--------------|
| Preview deploy of `maker/site-g-20260703` | Production deploy to werkles.com |
| `MATCHING_STORAGE_MODE=supabase` on **Preview** env only | `MATCHING_AUTONOMOUS_PUBLIC=true` |
| Migration `00004_matching_shadow_persistence.sql` after gate phrase | LLM matching (`MATCHING_LLM_TRANSLATE_ENABLED`) |
| Live smoke on preview origin | Retention cron / deletion automation |
| Operator shadow page on preview | Member-facing recommendation cards |

---

## Prerequisites (all must be true)

### Human gates

1. **Option B** durable persistence — `APPROVED` @ 2026-07-10 (`foreman/gates/APPROVAL_LOG.md`)
2. **Schema apply** — Ben says:

   ```text
   APPROVE MATCHING DURABLE SCHEMA APPLY
   ```

   Record in `foreman/gates/APPROVAL_LOG.md` before any SQL runs.

### Code & branch

| Item | Expected |
|------|----------|
| Branch | `maker/site-g-20260703` at or after `017fa2a` |
| Migration file | `supabase/migrations/00004_matching_shadow_persistence.sql` |
| Adapters | `lib/matching/shadow-store.ts`, `lib/discovery/intake-custody.ts`, `storage-mode.ts` |
| Routes | `/api/discovery/intake`, `/operator/matching/shadow` |

### Local mechanical proof (repeatable before preview)

```powershell
cd C:\Users\Ben Leak\github\Werkles
npm.cmd run typecheck
node scripts/foreman/test-matching-storage-mode.Inner.mjs
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "http://localhost:3000"
```

Latest VPG8 evidence: typecheck PASS, storage-mode 4/4 PASS, localhost smoke 7/7 PASS.

### Supabase (after schema gate only)

Apply migration via Supabase dashboard SQL editor or approved CLI path. Verify objects exist:

- `public.discovery_intakes`
- `public.matching_shadow_runs`
- RLS enabled on both tables
- Policies: `operators read discovery intakes`, `operators read matching shadow runs`

**Stop if:** migration errors, FK mismatch, or tables already exist with incompatible schema (escalate to Dink + patch gate).

### Vercel project

| Field | Value |
|-------|-------|
| Project | `werkles/werkles1` |
| Preview source branch | `maker/site-g-20260703` |
| Production alias | `https://werkles.com` (do **not** promote matching there in this runbook) |

---

## Environment variables (names only)

Verify presence on **Preview** target. Do not print values in receipts.

### Required (already on project — confirm still present)

| Name | Role |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes (`getSupabaseService()`) |

### Matching-specific (Preview only for this rollout)

| Name | Preview value | Production value |
|------|---------------|------------------|
| `MATCHING_STORAGE_MODE` | `supabase` | **unset or `file`** until separate production gate |
| `MATCHING_AUTONOMOUS_SHADOW` | (code default `true`) | same |
| `MATCHING_AUTONOMOUS_PUBLIC` | must remain **off** (code `false`) | must remain **off** |
| `MATCHING_LLM_TRANSLATE_ENABLED` | must remain **off** | must remain **off** |

Optional LLM keys (`OPENAI_API_KEY`, `MATCHING_LLM_API_KEY`) must **not** be added for this rollout.

### Flags in code (`lib/matching/feature-flags.ts`)

Shadow ON and public OFF are compile-time constants today. Env cannot accidentally flip public matching without a code change + separate gate.

---

## Stop conditions (abort rollout)

Stop immediately and file a receipt if any occur:

1. Schema gate phrase not recorded in `APPROVAL_LOG.md`
2. Migration not applied or verification query fails
3. `MATCHING_STORAGE_MODE=supabase` set on **Production** during preview rollout
4. Build fails on preview deployment
5. Intake POST returns non-200 or missing `shadow_run_id`
6. Operator shadow page 404 or 500 on preview origin
7. Supabase write error in deployment logs (RLS, FK, or service-role misconfig)
8. Any attempt to enable public matching or LLM layer
9. Smoke shows wrong top path on capital/job/training scenarios (escalate to Dink for ranking tune)

---

## Rollout sequence (preview only)

### Phase 0 — Record gate

- [ ] Ben: `APPROVE MATCHING DURABLE SCHEMA APPLY`
- [ ] Log row in `foreman/gates/APPROVAL_LOG.md`
- [ ] Receipt: `foreman/receipts/WERKLES_MATCHING_SCHEMA_APPLIED_<date>.md` (Operator or Dink)

### Phase 1 — Apply schema

- [ ] Open Supabase project linked to werkles.com
- [ ] Run `supabase/migrations/00004_matching_shadow_persistence.sql`
- [ ] Confirm tables + policies (names above)
- [ ] **Do not** run against wrong project / production data set without explicit scope

### Phase 2 — Preview env

- [ ] Vercel → `werkles/werkles1` → Settings → Environment Variables
- [ ] Add or update `MATCHING_STORAGE_MODE` = `supabase` for **Preview** only
- [ ] Confirm Production does **not** have `MATCHING_STORAGE_MODE=supabase` yet
- [ ] Redeploy preview from `maker/site-g-20260703` (push or Vercel redeploy — requires Ben deploy gate if production-touching)

### Phase 3 — Resolve preview URL

Note the deployment-specific preview URL (not werkles.com). Example pattern from prior deploy:

`https://werkles1-<hash>-werkles.vercel.app`

### Phase 4 — Live smoke (preview origin)

```powershell
cd C:\Users\Ben Leak\github\Werkles
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "https://werkles1-<preview-hash>-werkles.vercel.app"
```

Receipt path: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_<date>.json`

#### Expected PASS checks (minimum)

| Check | Pass criteria |
|-------|---------------|
| `capital_partner` | HTTP 200, `shadow_run_id` present |
| `job_change` | HTTP 200, `shadow_run_id` present |
| `training_not_partner` | HTTP 200, `shadow_run_id` present |
| `operator_shadow_page` | HTTP 200, page contains shadow UI copy |

#### Semantic golden paths (localhost only today)

The smoke mule reads `data/matching/shadow-runs.jsonl` for semantic assertions. On preview with `supabase` mode, **intake + page checks are authoritative**; golden path verification requires:

- Manual operator review at `/operator/matching/shadow` on preview, **or**
- Follow-up: query `matching_shadow_runs` in Supabase (Operator dashboard — no secrets in chat), **or**
- Future: extend smoke mule with service-role readback (not in v0 runbook)

Golden expectations (Dink QA):

| Scenario | Top eligible path |
|----------|-------------------|
| Capital + partner | `verify_proof` |
| Job change | `find_better_job` |
| Training not partner | `get_training` |

### Phase 5 — Cross-instance durability spot check

- [ ] POST one intake on preview
- [ ] Note `shadow_run_id`
- [ ] Trigger preview redeploy (or wait for cold start on second instance)
- [ ] Load `/operator/matching/shadow` — run should still appear

**Stop if:** run visible only on single instance (ephemeral storage leak — should not happen with supabase mode).

### Phase 6 — Hold point

- [ ] File receipt: `foreman/receipts/WERKLES_MATCHING_PREVIEW_ROLLOUT_<date>.md`
- [ ] **Stop.** Open separate Tier 1 gate for production deploy.
- [ ] Do **not** alias preview to werkles.com without production deploy gate.

---

## Rollback (preview)

If preview rollout fails or needs reversal:

### Fast rollback (no schema drop)

1. Remove `MATCHING_STORAGE_MODE` from Preview **or** set to `file`
2. Redeploy preview branch
3. Intakes fall back to ephemeral `/tmp` file mode on Vercel (same as pre-Option-B behavior)
4. Document in receipt: `foreman/receipts/WERKLES_MATCHING_PREVIEW_ROLLBACK_<date>.md`

### Schema rollback (destructive — separate gate)

Dropping `discovery_intakes` / `matching_shadow_runs` is **destructive** and requires explicit Operator approval. Default rollback is env flip only, not table drop.

---

## Production separation

| Surface | Preview rollout | Production (werkles.com) |
|---------|-----------------|--------------------------|
| Deploy | `maker/site-g-20260703` preview URL | Unchanged until separate gate |
| `MATCHING_STORAGE_MODE` | `supabase` | Not set in this runbook |
| Matching routes | May 404/500 today on prod | Fix only after prod deploy gate |
| Public recommendations | OFF | OFF |
| Member data | Test intakes only | No matching custody migration on prod tables |

Production deploy requires its own Tier 1 gate (`GATE-matching-shadow-production-path` successor or new gate after preview PASS).

---

## Evidence index

| Artifact | Path |
|----------|------|
| Schema gate | `foreman/reviews/GATE-matching-durable-schema-apply-20260710.md` |
| Migration | `supabase/migrations/00004_matching_shadow_persistence.sql` |
| VPG7 preflight | `foreman/receipts/WERKLES_MATCHING_GATE_PREFLIGHT_VPG7_20260711.md` |
| Infra status | `foreman/receipts/WERKLES_MATCHING_INFRA_STATUS_VPG7_20260711.md` |
| Smoke script | `scripts/foreman/Test-WerklesMatchingShadowSmoke.ps1` |
| Option B decision | `foreman/receipts/WERKLES_MATCHING_DURABLE_PERSISTENCE_DECISION_20260710.md` |

---

## Operator phrases (reference)

| Action | Phrase |
|--------|--------|
| Allow schema apply | `APPROVE MATCHING DURABLE SCHEMA APPLY` |
| Reject schema | `REJECT MATCHING DURABLE SCHEMA APPLY` |
| Patch gate | `PATCH MATCHING DURABLE SCHEMA GATE: <instructions>` |
| Production deploy | Separate gate — not defined in v0 runbook |
| Public matching go-live | `APPROVE MATCHING AUTONOMOUS GO-LIVE` (future) |
