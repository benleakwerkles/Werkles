# Werkles.com — 1Password setup (UI troubleshooting)

Status: OPERATOR GUIDE — updated for newer 1Password Developer UI  
If you do **not** see "View Environments" or "Integrate with 1Password CLI", use **Path B** below.

---

## What you are seeing (normal for newer builds)

Settings → **Developer** may show:

- Integrate with 1Password SDKs and MCP server  
- Integrate with MCP clients  
- Watchtower  
- Check for developer creds on disk  

That does **not** mean you are in the wrong place. The UI moved. Environments and CLI are often **not** on this Settings page anymore.

---

## Path A — Environments (if your build has them)

Current Betsy agent boundary:

- Stable CLI `2.34.1` does not expose `op environment`.
- Beta CLI `2.36.0-beta.02` exposes `op environment read` only.
- Codex cannot create or import 1Password Environments through the local CLI.
- Creation/import must happen in the 1Password desktop app, or through a 1Password MCP server if one is explicitly installed and exposed to Codex.

Try **sidebar first**, not Settings:

1. Unlock 1Password  
2. Left sidebar → **Developer** (top-level, same level as All Items / Watchtower)  
3. Look for **Environments** or **View Environments**  
4. New environment → import `foreman/gates/werkles-vercel-tier-a.env.template`  
5. Copy Environment ID → `foreman/gates/werkles-vercel-op.config.json`

If **Developer** is not in the sidebar:

- Settings → **Labs** → enable features related to Developer / MCP (if present)  
- Settings → **Developer** → enable **Integrate with MCP clients**  
- Restart 1Password  

Environments are **beta** — not every account/build shows them yet.

---

## Path B — Vault item + prefilled op:// refs (recommended if no Environments)

**No Environments feature required.** Store secrets in a normal 1Password item.

### B1 — Enable CLI access (Settings → Developer)

Look for **any** of these toggles and turn **on**:

| Toggle label (wording varies) |
|-------------------------------|
| Integrate with 1Password CLI |
| Command-Line Interface (CLI) → Integrate with 1Password CLI |
| Integrate with 1Password SDKs → **Integrate with other apps** |

Then verify in PowerShell:

```powershell
op vault list
```

If that lists vaults, CLI integration works.

### B2 — Create one vault item

In your normal vault (**Private** on Betsy, confirmed by `op vault list`):

**Item title:** `Werkles Vercel Secrets`

Add **eight fields** (Password or text fields — names must match exactly):

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

Paste each value from your existing 1Password entries (you already use these for Supabase/Vercel gates).

### B3 — Secret references are already staged

This repo already contains a prefilled refs file for the one-item path:

```text
foreman/gates/werkles-vercel-tier-a.env.oprefs
```

It points each env var at:

```text
op://Private/Werkles Vercel Secrets/<FIELD_NAME>
```

So the normal low-touch path is:

1. Create/fill the `Werkles Vercel Secrets` item.
2. Run `op vault list`.
3. If the vault is actually named something other than `Private`, update only the vault segment in `werkles-vercel-tier-a.env.oprefs`.

No secret values should ever be copied into the repo or chat.

### B4 — Blind sync (Lady Jessica runs)

```powershell
cd C:\Users\Ben Leak\github\Werkles
powershell -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -Target Both
```

No Environment IDs needed for this path.

---

## Path C — MCP (optional, for Cursor/Codex managing Environments)

Only if you want agents to create/list Environments via MCP:

1. Settings → **Labs** → **Enable local MCP server**  
2. Settings → **Developer** → **Integrate with MCP clients**  
3. Configure Cursor MCP to 1Password's local MCP binary (see 1Password docs)

This is **optional** for Werkles Vercel sync. Path B is enough.

---

## Verify before sync

```powershell
op vault list
cd C:\Users\Ben Leak\github\Werkles
powershell -File scripts\foreman\Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs -DryRun -Target Both
```

Reply **`OP_IS_READY`** when `op vault list` works and op refs are filled (or Environment IDs set for Path A).

---

## Still gated

- Secret sync: `APPROVE SECRET ENTRY` ✓  
- Production deploy: `APPROVE PRODUCTION ROLLOUT`  

No secret values in chat.
