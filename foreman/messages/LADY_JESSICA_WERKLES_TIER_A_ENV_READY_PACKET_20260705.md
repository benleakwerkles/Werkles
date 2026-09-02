# Lady Jessica - Werkles Tier-A Env Ready Packet

PACKET_ID: LADY_JESSICA_WERKLES_TIER_A_ENV_READY_PACKET_20260705
FROM: Heimerdinker@Betsy
TO: Lady Jessica / Maker@Betsy
LANE: Werkles.com only
STATUS: READY_FOR_BUILD

## Readback

Ben is handing you the Werkles.com lane with tier-A environment custody complete.

Canonical repo:

```text
C:\Users\Ben Leak\github\Werkles
```

Final gate receipt:

```text
C:\Users\Ben Leak\github\Werkles\foreman\receipts\WERKLES_COM_TIER_A_SECRET_GATE_FINAL_20260704.json
```

Receipt status:

```text
PASS_1PASSWORD_AND_VERCEL_TIER_A_ENV_READY_8_OF_8
```

## What Is True

- 1Password item `Werkles Automation / Werkles Vercel Secrets` validates 8/8.
- Vercel project `werkles1` has all 8 tier-A environment variable names in Preview and Production.
- Vercel values are encrypted.
- The sync path used `WINDOWS_CREDENTIAL_MANAGER`, not desktop 1Password prompt auth.
- Secret values were not printed, not committed, and not written into receipts.
- Secret-pattern scan on touched scripts and receipts returned `hitCount: 0`.

## Tier-A Names

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID
STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID
CRON_SECRET
```

## Verify Before Work

From:

```powershell
cd "C:\Users\Ben Leak\github\Werkles"
```

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-WerklesVercelSecretItem.ps1
npx.cmd vercel env ls
```

Expected:

```text
1Password: PASS_ALL_FIELDS_VALID, valid_field_count 8
Vercel: Preview 8/8 and Production 8/8 by name, values encrypted
```

## Guardrails

- Do not ask Ben for secret values.
- Do not print secret values.
- Do not paste secret values into chat.
- Do not create webpages, screenshots, logs, or receipts containing secret values.
- Do not use desktop 1Password prompt auth for this lane.
- If 1Password auth is needed, use the existing Windows Credential Manager service-token path only.
- If anything regresses, return BLOCKER with receipt path and exact command output summary, not secret values.

## First Action

Continue Werkles.com build work from the verified 8/8 tier-A environment baseline.

Return exactly one of:

```text
ACK LADY_JESSICA_WERKLES_TIER_A_ENV_READY_PACKET_20260705
BLOCKER LADY_JESSICA_WERKLES_TIER_A_ENV_READY_PACKET_20260705
ARTIFACT LADY_JESSICA_WERKLES_TIER_A_ENV_READY_PACKET_20260705
```
