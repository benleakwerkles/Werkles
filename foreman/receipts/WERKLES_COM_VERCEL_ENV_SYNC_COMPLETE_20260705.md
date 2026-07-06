# WERKLES_COM_VERCEL_ENV_SYNC_COMPLETE_20260705

RECEIPT_ID: WERKLES_COM_VERCEL_ENV_SYNC_COMPLETE_20260705
TIMESTAMP: 2026-07-05
LANE: Werkles.com / Betsy / Vercel env sync
MODE: OpRefs / service account (Windows Credential Manager)

## Secret Safety

SECRET_VALUES_READ: NO (op run blind)
SECRET_VALUES_PRINTED: NO
SECRET_VALUES_WRITTEN_TO_REPO: NO

## Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -Target Both
```

## Result

- OP_AUTH_SOURCE: WINDOWS_CREDENTIAL_MANAGER
- OPREFS_VALID_FIELD_COUNT: 8
- OPREFS_SKIPPED_MISSING_FIELDS: NONE
- Preview: 8/8 tier-A names ADDED
- Production: 8/8 tier-A names ADDED
- Exit code: 0

## Vercel verify (names only)

Preview (8): CRON_SECRET, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID, STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY

Production (8): same set

## Still gated

Production redeploy requires `APPROVE PRODUCTION ROLLOUT`.
