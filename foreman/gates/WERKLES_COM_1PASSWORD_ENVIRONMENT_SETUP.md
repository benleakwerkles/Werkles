# Werkles.com — 1Password Environment setup

Status: OPERATOR SETUP GUIDE  
Gate: `APPROVE SECRET ENTRY` — approved  
Agent prep: Lady Jessica  
Values live in **1Password only** — never chat, repo, or receipts.

---

## Why Environments

1Password **Environments** hold project secrets as named variables. Lady Jessica / Direwolf Dink run a local blind sync script that pipes Environment → Vercel without you copy/pasting values.

---

## Step 1 — Enable CLI integration (Betsy)

In the **1Password Windows app**:

1. Open and unlock 1Password  
2. Select your account at top of sidebar  
3. **Settings → Developer**  
4. Turn on **Integrate with 1Password CLI**  
5. Optional: **Windows Hello**

Verify:

```powershell
op account list
op vault list
```

---

## Step 2 — Create Environments

In 1Password: **Developer → View Environments → New environment**

Current Betsy agent boundary:

- Stable CLI `2.34.1` does not expose `op environment`.
- Beta CLI `2.36.0-beta.02` exposes `op environment read` only.
- Codex cannot create or import 1Password Environments through the local CLI.
- Creation/import must happen in the 1Password desktop app, or through a 1Password MCP server if one is explicitly installed and exposed to Codex.

Create **two** Environments (recommended while Preview vs Production may differ):

| Environment name | Vercel target | Notes |
|------------------|---------------|-------|
| `Werkles Vercel Preview` | Preview | Stripe **test** keys |
| `Werkles Vercel Production` | Production | Same test keys until live gate; separate Environment keeps lanes clean |

Copy each Environment ID: **View environment → Manage environment → Copy environment ID**

Paste IDs into `foreman/gates/werkles-vercel-op.config.json` (IDs are not secrets).

---

## Step 3 — Add tier-A variables

**Import path:** Developer → View Environments → your Environment → **Import .env file**

Use template (names + empty values — fill values in 1Password UI):

`foreman/gates/werkles-vercel-tier-a.env.template`

**Or add manually** — these eight names exactly:

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

Keep **Hide value by default** on for all variables.

Do **not** add Crucible tier-B price IDs until that gate opens.

---

## Step 4 — CLI note (Environments beta)

`op environment read` requires 1Password CLI **beta** `2.33.0-beta.02+`.  
Stable `2.34.1` on Betsy today does **not** include `op environment` yet.

**Options:**

| Option | When to use |
|--------|-------------|
| **A — Install 1Password CLI beta** | Full `op run --environment <id>` blind sync (recommended) |
| **B — Environment → Local .env destination** | Mount from 1Password app; script uses `op run --env-file=<mounted path>` with stable CLI |
| **C — Vault items + `op://` refs** | Stable CLI today; put refs in `werkles-vercel-tier-a.env.oprefs` (see script `-Mode OpRefs`) |

After beta install, verify:

```powershell
op environment read <environmentID>
```

---

## Step 5 — Record Environment IDs

Edit `foreman/gates/werkles-vercel-op.config.json`:

```json
"onePasswordEnvironments": {
  "preview": { "environmentId": "<paste Preview ID>" },
  "production": { "environmentId": "<paste Production ID>" }
}
```

Commit **IDs only** — never values.

---

## Step 6 — Blind sync (Lady Jessica / Direwolf Dink)

From canonical repo:

```powershell
cd C:\Users\Ben Leak\github\Werkles

# Dry run — names only
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -DryRun

# Sync Preview
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Target Preview

# Sync Production (still no deploy without APPROVE PRODUCTION ROLLOUT)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Target Production
```

Ben is **not** the mule. Script output is names + OK/SKIP/FAIL only.

---

## Still gated

| Action | Gate |
|--------|------|
| Enter/change Vercel values | `APPROVE SECRET ENTRY` ✓ |
| Production redeploy | `APPROVE PRODUCTION ROLLOUT` |
| Live Stripe keys | `APPROVE PAID CHECKOUT GO-LIVE` |

---

## When ready

Tell Lady Jessica:

```text
OP_ENVIRONMENT_IDS_SET
```

or

```text
OP_IS_READY
```

No secret values in the message.
