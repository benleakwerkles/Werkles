# Plaid developer mule — 2026-07-05

Status: **POLLING** (waiting for keys on dashboard)

Machine: BETSY | Operator: Ben Leak | ben.leak@kindsir.com | Werkles, Inc | US

## Ben — one thing

Plaid signup/login should be open in your **default browser** (Chrome/Edge).

Complete it with:
- Email: **ben.leak@kindsir.com**
- Company: **Werkles, Inc**
- Country: **US**
- Password: **you choose** (1Password may prompt — approve)

Land on **Developers → Keys** with the sandbox secret visible. Leave that tab open.

**Do not copy anything.** Mule reads Chrome/UI, validates via Plaid sandbox API, stores in 1Password, syncs Vercel, runs Crucible smoke.

## What the mule does automatically

1. `Import-PlaidSandboxKeysFromChromeTo1Password.ps1` — Chrome/Edge storage + UI automation, validates pair
2. `Test-WerklesCrucibleProviderSecrets.ps1` — names-only validation
3. `Sync-WerklesCrucibleProviderEnvFrom1Password.ps1` — Preview + Production
4. `Test-WerklesCrucibleProviderMule.ps1` — Stripe webhook + Plaid link token smoke

## Last run

60 poll attempts, no keys captured — Plaid dashboard session not on keys page yet.

Receipt: `foreman/receipts/WERKLES_PLAID_DEVELOPER_MULE_20260705.json`

## Re-run manually

```powershell
cd C:\Users\Ben Leak\github\Werkles
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Invoke-WerklesPlaidDeveloperMule.ps1
```
