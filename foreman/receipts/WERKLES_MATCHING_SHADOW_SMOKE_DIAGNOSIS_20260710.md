# Matching Shadow Smoke — Diagnosis (production vs local)

| Field | Value |
|-------|-------|
| **Receipt** | `WERKLES_MATCHING_SHADOW_SMOKE_DIAGNOSIS_20260710` |
| **Dink smoke** | FAIL @ `https://werkles.com` |
| **Maker re-smoke** | PASS @ `http://localhost:3000` |
| **Branch** | `maker/site-g-20260703` @ `a838d2c` |

---

## Verdict

**Engine is fine on localhost.** Production failure is **deploy + environment**, not algorithm logic.

| Check | Production (`werkles.com`) | Localhost (`:3000`) |
|-------|---------------------------|---------------------|
| Discovery intake | HTTP 500 | HTTP 200 |
| `shadow_run_id` | null | present (3/3) |
| Operator shadow page | HTTP 404 | HTTP 200 |

---

## Root causes

### 1. Production not on matching branch

`/operator/matching/shadow` returns **404** on werkles.com — matching operator page from `maker/site-g-20260703` is **not deployed** to production yet.

**Gate:** Operator deploy approval required.

### 2. Vercel read-only filesystem

Production intake error:

```text
ENOENT: no such file or directory, mkdir '/var/task/data/discovery'
```

Discovery + shadow storage wrote under `process.cwd()/data/*`. On Vercel, `/var/task` is read-only.

**Maker fix (same session):** `lib/server/writable-data-root.ts` — uses `os.tmpdir()` on Vercel. Wired into `lib/discovery/concierge.ts`, `lib/matching/shadow-storage.ts`, `lib/matching/shadow-pipeline.ts`.

**Caveat:** `/tmp` on Vercel is **ephemeral per invocation** — shadow runs won't persist across serverless instances until Supabase/object storage lands. Fine for smoke proof post-deploy; not fine for durable operator review on prod long-term.

---

## Dink — rerun now (localhost)

```powershell
cd C:\Users\Ben Leak\github\Werkles
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "http://localhost:3000"
```

Or omit `-SiteOrigin` — smoke script now auto-detects localhost when shadow page responds.

Then human review: `http://localhost:3000/operator/matching/shadow`

---

## Production path (later)

1. Ben approves deploy of `maker/site-g-20260703` to werkles.com
2. Re-run smoke with `-SiteOrigin "https://werkles.com"`
3. Expect intake 200 after writable-data-root deploy (ephemeral shadow storage)
4. Plan durable storage gate before public flip

---

*Lady Jessica · Maker@Betsy · 2026-07-10*
