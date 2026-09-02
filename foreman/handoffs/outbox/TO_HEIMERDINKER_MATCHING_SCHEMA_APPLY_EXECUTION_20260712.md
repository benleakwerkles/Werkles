# TO HEIMERDINKER — Matching Schema Apply Execution

| Field | Value |
|-------|-------|
| **Packet** | `TO_HEIMERDINKER_MATCHING_SCHEMA_APPLY_EXECUTION_20260712` |
| **From** | Lady Jessica (Maker@Betsy) |
| **To** | Heimerdinker / Direwolf Dink@Betsy |
| **Lane** | Werkles.com / G — matching durable custody only |
| **Priority** | **P0 — blocks preview deploy** |
| **Operator rule** | **Zero Ben paste / copy / SQL mule work** |

---

## Mission

Apply approved migration `supabase/migrations/00004_matching_shadow_persistence.sql` to the live Werkles Supabase project, verify both tables exist, file receipt. Dink owns all auth resolution on Betsy.

---

## Gates (already approved — do not re-ask Ben)

Logged in `foreman/gates/APPROVAL_LOG.md` @ 2026-07-12:

| Gate | Phrase | Status |
|------|--------|--------|
| Schema apply | `APPROVE MATCHING DURABLE SCHEMA APPLY` | **APPROVED** |
| Data policy V0 | `approve matching data policy` | **APPROVED** |

Parent: Option B durable persistence (`REQUIRE MATCHING DURABLE PERSISTENCE BEFORE DEPLOY`).

---

## Maker preflight (2026-07-12)

| Check | Result |
|-------|--------|
| `discovery_intakes` on live project | **missing** (`PGRST205`) |
| `matching_shadow_runs` on live project | **missing** (`PGRST205`) |
| Code on branch `maker/site-g-20260703` @ `6790477` | adapters + insert-only run_id wired |
| `Apply-MatchingShadowMigration.ps1` | auth blocked |
| Werkles 1Password automation token | **missing** |
| `~/.supabase/access-token` | **missing** |
| Chrome Supabase Management session | **missing** |

**Verdict:** migration approved, not applied. **Dink must unblock auth on Betsy.**

---

## LOCAL HANDS READBACK (mandatory)

```text
Machine:
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
HEAD:
Working tree:
1Password automation token present: yes/no
Supabase CLI token present: yes/no
```

---

## Execution ladder (in order — stop only with receipt)

### Step 0 — Canonical repo

```powershell
cd C:\Users\Ben Leak\github\Werkles
git checkout maker/site-g-20260703
git pull origin maker/site-g-20260703
```

### Step 1 — Bootstrap no-prompt 1Password (if missing)

```powershell
.\scripts\foreman\Enter-WerklesOnePasswordAutomationSession.ps1 -Verify
```

If `WERKLES_OP_AUTH_SOURCE=NONE`:

- Run `.\scripts\foreman\Store-WerklesOnePasswordAutomationToken.ps1` **only** if service-account token already exists in approved custody.
- **Do not** ask Ben to paste secrets in chat.
- If automation token cannot be installed without Operator paste, use **Step 2 only** (Supabase CLI OAuth).

### Step 2 — Supabase CLI auth (preferred — OAuth click only)

```powershell
npx supabase login
```

This opens browser OAuth. Ben may need **one** provider click if not already signed in. **No token paste.**

Link project (ref derived from `NEXT_PUBLIC_SUPABASE_URL` in 1Password / op run):

```powershell
npx supabase link --project-ref <project-ref>
```

Apply:

```powershell
npx supabase db query --file supabase/migrations/00004_matching_shadow_persistence.sql --linked
```

### Step 3 — Management API fallback (Chrome session)

If Step 2 fails, ensure Ben is signed into [Supabase Dashboard](https://supabase.com/dashboard) in **Chrome on Betsy**, then:

```powershell
.\scripts\foreman\Apply-MatchingShadowMigration.ps1
```

Or orchestrator (tries CLI then management API):

```powershell
.\scripts\foreman\Invoke-MatchingShadowSchemaApply.ps1
```

### Step 4 — Verify (required)

```powershell
$op = (Get-Command op).Source
& $op run --env-file="foreman\gates\werkles-vercel-tier-a.env.oprefs" -- node -e "const {createClient}=require('@supabase/supabase-js'); const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}}); (async()=>{for (const t of ['discovery_intakes','matching_shadow_runs']){const {error}=await c.from(t).select('*').limit(1); console.log(t+':'+(error?error.code:'ok'));}})();"
```

**PASS:** both tables return `ok` (not `PGRST205`).

### Step 5 — Receipt

Create/update: `foreman/receipts/WERKLES_MATCHING_SCHEMA_APPLIED_20260712.md`

| Field | Value |
|-------|-------|
| Status | `APPLIED` or `ALREADY_APPLIED` |
| Path used | `supabase_db_query_linked` / `management_api` |
| Tables verified | `discovery_intakes`, `matching_shadow_runs` |
| Secrets printed | NO |

Tag Maker: **schema applied — proceed preview rollout runbook Phase 2.**

---

## Hard stops

| Do not | Why |
|--------|-----|
| Ask Ben to paste PAT/DB URL in chat | Operator paste mule — forbidden |
| Apply to wrong Supabase project | verify ref from 1Password URL |
| Enable public matching | separate gate |
| Set `MATCHING_STORAGE_MODE=supabase` on Production | preview first per runbook |
| Deploy to werkles.com | separate deploy gate |

---

## Artifacts index

| Artifact | Path |
|----------|------|
| Migration | `supabase/migrations/00004_matching_shadow_persistence.sql` |
| Schema gate | `foreman/reviews/GATE-matching-durable-schema-apply-20260710.md` |
| Preview runbook | `foreman/reviews/WERKLES_MATCHING_PREVIEW_ROLLOUT_RUNBOOK_V0_20260711.md` |
| Management apply script | `scripts/foreman/Apply-MatchingShadowMigration.ps1` |
| Orchestrator | `scripts/foreman/Invoke-MatchingShadowSchemaApply.ps1` |
| Blocked receipt | `foreman/receipts/WERKLES_MATCHING_SCHEMA_APPLIED_20260712.md` |

---

## Success phrase back to Ben

```text
MATCHING SCHEMA APPLIED — tables verified. Ready for preview env + deploy.
```

---

## If still blocked after ladder

Return receipt with:

1. Which ladder step failed
2. HTTP/status codes only (no secrets)
3. Whether 1Password automation token is installable without Operator paste
4. Recommendation: one-time `supabase login` OAuth at machine (not paste)

Do **not** bounce Ben to SQL editor copy/paste.
