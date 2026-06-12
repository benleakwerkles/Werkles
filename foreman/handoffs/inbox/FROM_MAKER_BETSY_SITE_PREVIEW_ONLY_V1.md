# FROM MAKER - BETSY SITE PREVIEW ONLY V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: Betsy site-preview checklist/report. No GD/SoleDash test, PR #12 checkout, merge, deploy, provider mutation, SQL, secrets, app code change, or live data mutation was performed by this report.

## Mission

Ignore GD/SoleDash port 4317.

Goal:

```text
Get Werkles site preview running on Betsy at localhost:3000.
```

Check:

- `node -v`
- `npm -v`
- repo path exists
- `npm install`
- `npm run dev`
- homepage loads

## Evidence Boundary

This cloud agent cannot inspect Betsy's local Windows filesystem, PATH, installed Node/npm, local `node_modules`, local `.env`, local terminal output, or `localhost:3000`.

Therefore:

```text
Betsy-local checks are UNKNOWN until run on Betsy.
```

This report identifies:

- exact commands for Betsy
- expected success output
- known repo-side requirements
- first successful preview milestone

---

# Repo-Side Facts

## Package scripts

From `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

## Framework versions

From `package.json`:

```text
next: ^15.3.2
react: ^19.0.0
react-dom: ^19.0.0
```

## Node version required

Repo has no explicit `engines.node` field.

Effective requirement comes from Next 15:

```text
Node ^18.18.0 || ^19.8.0 || >=20.0.0
```

Recommended Betsy target:

```text
Node 20 LTS or Node 22 LTS
```

Do not use Node 16 or early Node 18.

## Env vars for homepage preview

For the homepage `GET /` render:

```text
No provider env vars are expected to be required.
```

Reason:

- `app/page.tsx` renders static/homepage components and client `BetaSignupForm`.
- `BetaSignupForm` only calls `/api/beta` on form submit.
- Loading the homepage should not require Supabase/Stripe secrets.

Important:

```text
Other routes/actions may require env vars.
The goal here is homepage preview only.
Do not test auth, billing, Crucible, Stripe, Supabase, or beta form submission for this mission.
```

---

# Betsy Check Commands

Run in PowerShell on Betsy.

## 1. Repo path exists

```powershell
Test-Path "C:\Users\benle\Desktop\github\Werkles\.git"
```

Expected:

```text
True
```

If false:

```text
RED - repo missing or path wrong.
```

## 2. Enter repo

```powershell
cd C:\Users\benle\Desktop\github\Werkles
git status --short --branch
```

Expected:

```text
Shows a Werkles branch and does not error.
```

## 3. Node installed

```powershell
node -v
```

GREEN:

```text
v20.x.x, v22.x.x, or any version satisfying ^18.18.0 || ^19.8.0 || >=20.0.0
```

YELLOW:

```text
v18.18.0+ works but older 18.x should be checked carefully.
```

RED:

```text
command not recognized
Node 16.x
Node <18.18.0
```

## 4. npm installed

```powershell
npm -v
```

GREEN:

```text
prints a version.
```

RED:

```text
command not recognized
```

## 5. Install dependencies

Only after repo path, Node, and npm are GREEN.

```powershell
npm install
```

Expected:

```text
Dependencies install without fatal error.
```

If it fails:

```text
Record the first fatal error line.
Do not change package files manually.
Do not install random global packages.
```

## 6. Start site preview

```powershell
npm run dev
```

Expected:

```text
next dev
Local: http://localhost:3000
```

Keep this terminal open.

## 7. Homepage loads

In a second PowerShell window:

```powershell
Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing
```

Expected:

```text
StatusCode: 200
```

Then open browser:

```powershell
Start-Process "http://127.0.0.1:3000/"
```

Expected visual:

```text
Werkles homepage loads.
```

---

# Audit Table

| Check | Betsy status | GREEN | YELLOW | RED |
|-------|--------------|-------|--------|-----|
| Repo path exists | UNKNOWN until Betsy check | `.git` path returns True | repo elsewhere | expected path missing |
| Git usable | UNKNOWN until Betsy check | `git status` works | branch dirty but usable | git command fails |
| Node installed | UNKNOWN until Betsy check | Node 20/22 or supported range | supported but older 18.x | missing or unsupported |
| npm installed | UNKNOWN until Betsy check | `npm -v` prints version | version prints but install fails | missing |
| `npm install` | UNKNOWN until Betsy run | completes | warnings only | fatal error |
| `npm run dev` | UNKNOWN until Betsy run | starts Next on 3000 | starts on alternate port | fatal error |
| Homepage loads | UNKNOWN until Betsy run | HTTP 200 on `/` | slow compile then 200 | connection refused / 500 |

---

# Exact Minimal Command Block

Use this as the fastest Betsy runbook:

```powershell
Test-Path "C:\Users\benle\Desktop\github\Werkles\.git"
cd C:\Users\benle\Desktop\github\Werkles
git status --short --branch
node -v
npm -v
npm install
npm run dev
```

Then second PowerShell:

```powershell
Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing
Start-Process "http://127.0.0.1:3000/"
```

---

# First Successful Preview Milestone

The first successful preview milestone is:

```text
Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing returns HTTP 200.
```

The visible milestone is:

```text
Browser opens http://127.0.0.1:3000/ and shows the Werkles homepage.
```

Do not count `npm run dev` startup alone as success. The page must answer.

---

# Expected Blockers And Fast Interpretation

## Repo path false

Meaning:

```text
Betsy does not have the repo at the expected path, or the folder name differs.
```

Fast next check:

```powershell
Test-Path "C:\Users\benle\Desktop\github\Werkles"
Get-ChildItem "C:\Users\benle\Desktop\github" -Directory
```

## Node missing or unsupported

Meaning:

```text
Cannot run Next preview.
```

Required:

```text
Node ^18.18.0 || ^19.8.0 || >=20.0.0
```

## npm missing

Meaning:

```text
Cannot install dependencies with npm.
```

## `npm install` fails

Likely causes:

- unsupported Node version
- network/npm registry problem
- lockfile/dependency install issue
- permission/path issue

Record:

```text
first fatal npm error
Node version
npm version
```

## `npm run dev` fails

Likely causes:

- dependencies not installed
- unsupported Node version
- port 3000 occupied
- compile error

Port check:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

If port occupied:

```powershell
$env:PORT=3001
npm run dev
```

Open:

```text
http://127.0.0.1:3001/
```

## Homepage returns 500

Meaning:

```text
Next started, but route render failed.
```

Record:

- terminal error
- HTTP status
- first stack trace line

Do not test provider routes for this mission.

---

# What Not To Do

Do not:

- touch PR #12
- test GD/SoleDash
- use port 4317
- merge
- deploy
- enter secrets
- test Stripe/Supabase/provider flows
- submit the beta form
- run production build unless separately requested

This mission is only:

```text
Werkles homepage local preview at localhost:3000.
```

---

# Maker Current Assessment

Known from repo:

```text
Homepage preview should not require env vars.
Node must satisfy Next 15's runtime range.
The exact preview command is npm run dev.
```

Unknown until Betsy runs commands:

```text
Git installed
Node installed
npm installed
repo present
npm install result
npm run dev result
homepage HTTP 200
```

Fastest path to proof:

```powershell
cd C:\Users\benle\Desktop\github\Werkles
node -v
npm -v
npm install
npm run dev
```

Then:

```powershell
Invoke-WebRequest "http://127.0.0.1:3000/" -UseBasicParsing
```
