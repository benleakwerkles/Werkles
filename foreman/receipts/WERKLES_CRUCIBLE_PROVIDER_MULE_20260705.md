# Crucible provider mule — 2026-07-05

Status: **NEEDS_OPERATOR** (Plaid secrets + Stripe Identity enablement)

Machine: BETSY (`LOCAL_SALLY_WINDOWS`)  
Branch: `maker/site-g-20260703`  
Receipt JSON: `foreman/receipts/WERKLES_CRUCIBLE_PROVIDER_MULE_20260705.json`

## Before you click

**Plaid (required for Link test):** Open [Plaid sandbox keys](https://dashboard.plaid.com/developers/keys). Copy **Client ID** → clipboard → run:

```powershell
cd C:\Users\Ben Leak\github\Werkles
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Set-1PasswordFieldFromClipboard.ps1 -FieldName PLAID_CLIENT_ID
```

Copy **Sandbox secret** → clipboard → run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Set-1PasswordFieldFromClipboard.ps1 -FieldName PLAID_SECRET
```

Then say **plaid pasted** — mule re-runs sync + smoke automatically.

**Stripe Identity (optional for live redirect):** In [Stripe Dashboard → Identity](https://dashboard.stripe.com/identity), enable Identity for the test account. The stored key is a restricted `rk_test_*` key; Identity session create returned **403** until Identity is enabled or a full `sk_test_*` key with Identity scope is stored. Crucible still falls back to sandbox stub when redirect is unavailable.

## Mule results

| Step | Status | Detail |
|------|--------|--------|
| ensure_plaid_fields | PASS | Labels present in 1Password |
| validate_plaid_secrets | **BLOCKED** | `PLAID_CLIENT_ID`, `PLAID_SECRET` empty |
| stripe_webhook_identity_events | **PASS** | 7 events on `we_1Tq0y6BzNBvy0VkUWOJLgD6l`; identity events added |
| provider_api_smoke | **PARTIAL** | Stripe shape PASS; Identity 403; Plaid missing |
| vercel_sync_plaid | SKIPPED | Waiting on valid Plaid fields |

## Fixes applied this session

- `op run` on Windows: use PowerShell `-File` inner scripts (not direct `node`) so env injection works with spaced paths.
- Accept `rk_test_*` restricted Stripe keys in mule validators (was falsely reporting “missing”).
- Combined oprefs temp file: write UTF-8 **without BOM** (fixed dotenv parse error).
- Stripe webhook update: proper `enabled_events[]` form encoding.
- Extended clipboard/stdin 1Password setters for `PLAID_*` fields.
- Added `Import-PlaidSandboxFromClipboard.ps1` orchestrator.

## Re-run after Plaid paste

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-WerklesCrucibleProviderMule.ps1
```

Expected after paste: `validate_plaid_secrets` PASS → Vercel sync → `plaid_link_token` PASS.
