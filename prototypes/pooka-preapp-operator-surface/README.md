# PreApp Operator review surface — isolated prototype

**Project:** `POOKA-PREAPP-OPERATOR-SURFACE`  
**Status:** Isolated prototype — **read-only-first**, no live activation  
**Execution context for this build:** `CURSOR_CLOUD_CONTAINER`  
**Does not create:** live signing-key custody, UAC elevation, credential fields, provider sessions, installation, recurrence, push, merge, or deployment

Operator review surface for **one compiled PreApp review**. Displayed bytes and any decision payload bind to the same `review_sha256` and `catalog_sha256`.

Rendering this checklist does not authorize or execute it.

---

## Trusted display fields

Exact compiled-review bytes, never invented at render time:

- title
- consequence
- reversibility
- administrator requirement
- channel
- resource digest
- expiration
- machine
- receiver
- selected requirement identifiers

## Core model (reuse, do not fork display strings)

```text
lib/harvey/pooka-preapp-action-catalog.mjs
lib/harvey/pooka-preordained-approval.mjs
lib/harvey/pooka-preapp-native-handoff.mjs
```

## Isolated surface files

```text
prototypes/pooka-preapp-operator-surface/
  README.md
  package.json
  src/operator-surface.mjs
  src/operator-surface.css
  src/displayed-bytes.mjs
  scripts/render-fixture.mjs
  tests/accessibility.test.mjs
  tests/hostile.test.mjs
  fixture/   ← generated review HTML / JSON (not a live approval)
```

## Channel separation

| Channel | This surface |
|---|---|
| Internal approval | Dormant / synthetic ack only |
| UAC | Visible notice. Operator-owned supported Windows elevation. Not automated. |
| Credentials | Visible prohibition. No password/OTP fields. |
| Provider sign-in | Visible prohibition. Not exercised. |
| Unsupported | Visible. Cannot be approved or executed here. |

## Tests

From this directory:

```bash
npm test
npm run render
```

Covered:

- Keyboard tab order on every selected action
- Visible `:focus` / `:focus-visible` styles
- Screen-reader labels (`aria-labelledby`, `aria-describedby`, `aria-label`)
- Narrow/mobile `@media (max-width: 640px)` stacked layout
- No hidden selected actions
- Displayed bytes bind to `review_sha256` + `catalog_sha256`
- Decision payload binds to the same hashes
- Hostile: forged title, hidden selected action, hash mismatch, live intents, channel confusion

## Explicit non-claims

- Live approval was not exercised.
- UAC was not exercised.
- Credentials were not entered.
- Provider sign-in was not exercised.
- No live signing key was created or used.
