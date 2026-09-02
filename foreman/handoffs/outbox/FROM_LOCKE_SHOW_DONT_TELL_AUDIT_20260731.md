> **PROVENANCE CORRECTION (2026-07-31, foreman):** Produced by a Cursor
> in-session subagent wrongly given the Locke name — NOT the actual Locke
> seat. Claims were verified against the code and the fixes landed; the real
> crew retains re-review authority. See
> `FROM_FOREMAN_SUBAGENT_IMPERSONATION_CORRECTION_20260731.md`.

---

## LOCKE — RED-TEAM VERDICT: Privacy/Terms drafts, Spark section, no-ceiling sweep

**Execution context:** `LOCAL_SALLY_WINDOWS` (Cursor, read-only file access; no edits made, no commands run). Repo read at `C:\Users\Ben Leak\github\Werkles`. This is a non-gate technical proof (read-only review) — no gate triggered.

---

### 1. Provider status labels — PASS (with one consistency note)

Every label in the privacy table checks out against the code:

- **Supabase / Vercel "Live today"** — auth wiring is enabled (`AUTH_STRIPE_TEST_WIRING_ENABLED = true`); site is hosted. Accurate.
- **Stripe "Ready — payments not yet live"** — `lib/app-infra-preview.ts` says test-mode checkout may run while "live Stripe keys remain gated separately." Accurate: no real card is charged today.
- **Stripe Identity "Test integration — not yet live"** — matches `stripe_identity_test` mode in `lib/crucible-providers.ts` and the membership page's "Test integration ready." Accurate.
- **Plaid "Sandbox — not yet live"** — `PLAID_ENV` defaults to sandbox. Accurate.
- **Twilio "Planned — not connected yet"** — verbatim match with `app/membership/page.tsx`, and Twilio appears nowhere in the codebase except copy strings. No SDK, no env vars, no route. Accurate.

Note only: privacy says "not yet live" where membership says "ready" — privacy is the more conservative of the two, which is the right direction. No change needed.

### 2. Funds walkthrough ("yes or no... not your transactions"; 30-day expiry) — FLAG (the biggest one)

- **The 30-day expiry is real in the draft schema**: `LIQUIDITY_RECEIPT_TTL_DAYS = 30` in `lib/plaid/types.ts`. But that file is explicitly "V0 draft... Implementation follows schema + partnership gates." No expiry is enforced by any running code today.
- **The wiring requests more than yes/no.** `createPlaidLinkToken` in `lib/crucible-providers.ts` requests `products: ["assets"]` — Plaid Assets is a full asset report: balances, transactions, account-holder identity. The current exchange route never fetches a report and discards the access token, so Werkles doesn't *see* transactions today — but the consent scope granted to Werkles is not "one yes/no question." Writing "Not your balance, not your transactions" as an absolute, while the wiring is scoped to Assets, is the kind of gap a regulator or journalist finds first.
- **Worse: no yes/no computation exists at all.** The exchange route marks `funds_status: "sandbox_verified"` on any successful connection, threshold unchecked. And even the drafted receipt schema shares a `liquidityBand` ("$25k–$50k" etc.) publicly — bands are more than yes/no.

**Replacement wording for step 3 of the funds walkthrough:**
> "Plaid confirms whether the threshold is met — Werkles is designed to keep only that answer, never your login. This flow is in sandbox today; before it goes live we will publish exactly what Plaid shares."

**Replacement for step 4:**
> "The answer is designed to expire after 30 days. Nothing about your account stays on Werkles."

And a directive to the Foreman: either switch the Plaid product scope from `assets` to the narrowest product that answers the threshold question, or stop writing "not your transactions" until the scope matches the sentence.

### 3. Identity walkthrough (photos with Stripe, pass/fail only) — PASS

Verified against the wiring: the verification session runs at Stripe's hosted URL; the webhook (`app/api/webhooks/stripe/route.ts`) stores only a mapped status (`sandbox_verified` / `live_verified` / `pending` / `none`) to `id_status`. No image data touches Werkles. "The photos stay with Stripe under their retention rules" is accurate and appropriately points at Stripe's policy rather than promising one Werkles doesn't control.

### 4. "No check, no badge, no exceptions — including for us" — FLAG

Present-tense absolute promise while no live check exists and sandbox checks *do* set `id_status: "sandbox_verified"` / `funds_status: "sandbox_verified"`. If any surface renders a badge off those fields, the sentence "a member's 'verified' badge means a real check ran" is false today. The later "Verification data, before it goes live" section hedges correctly, but this paragraph doesn't inherit that hedge and will be quoted standalone.

**Replacement:**
> "When live checks open, that rule is absolute: no check, no badge, no exceptions — including for us. Today, verification is in preview, and no badge on Werkles means a live check has run."

### 5. Anti-bot-farm line — PASS

Confirmed: no named platform anywhere on the privacy or terms pages — no X, no Instagram, no Facebook. "Werkles is not a feed you scroll past bots on" is generic category positioning, not disparagement of an identifiable competitor. Legally clean. (Soft note: it leans on verification that isn't live; the fix in finding 4 covers that exposure.)

### 6. "Encrypted — unreadable even to us" — FLAG (precision)

Supabase Auth stores passwords **hashed** (bcrypt), not encrypted. Encryption implies reversibility with a key; hashing is one-way. On a page whose whole brand is precision, this word is a free hit for a technical reader.

**Replacement for the Supabase row:**
> "Your email, your password (stored only as a one-way hash — unreadable even to us), and your profile"

### 7. Terms no-ceiling line ("what you build here is yours") — FLAG

The sentiment is right; the drafting is loose. "What you build **here**" can be read to cover content created *on the platform* — Workshop entries, intake text, profiles — and the terms have no IP section at all. Two problems a lawyer flags: (a) it's an affirmative ownership representation Werkles doesn't need to make in the "What Werkles is" section, and (b) it boxes in the future user-content license every platform needs (a license to host, display, and process what members post). Say ownership stays with the member without the word "here" doing double duty.

**Replacement:**
> "There is no ceiling in these terms — your venture, your ideas, and what you make of them are yours, at whatever scale you take them to. Werkles claims no ownership of your business."

### 8. Spark mock receipts and "actually look like" — FLAG

Two exposures in `app/spark/page.tsx`:

- The proof mock rows — "Identity — verified (Stripe Identity)" and "Funds at least $25k — yes (Plaid)" — read as live receipts with real provider names attached. Unlike the other three mocks (an intake quote, a profile, lesson titles), these assert verification *outcomes*. A stranger screenshotting this card has a plausible claim they were told live verification exists.
- The lead sentence "this is what the four free surfaces actually look like" — "actually" is doing overclaiming work for a surface that is preview/test today.

**Replacements:**
- Lead sentence: *"Not a feature list — this is the shape of the four free surfaces. (Sample data; verification providers are listed with live status on the privacy page.)"*
- Proof card list, add a first row or footer line: *"Sample receipt — live checks arrive with the providers named on the privacy page."*
- The "Funds at least $25k — yes" row also bakes in the strict yes/no framing flagged in finding 2; it survives if finding 2's fix lands.

The anthem line ("We are the music makers...") is O'Shaughnessy's 1873 "Ode," public domain — no clearance issue, and the Wonka association rides on the poem, not the film. PASS on that element.

---

**Sweep note (bonus):** the site-wide "small business" removal is clean in `lib/copy.ts`, `lib/hero-copy-variants.ts`, `app/layout.tsx`, and `lib/narrative-arc.ts` — remaining hits are only the rule-documenting comments plus one sample intake quote in the internal operator tool (`app/operator/matching/document-score/document-score-client.tsx`: "a small business loan"). That's a user-voice sample naming a loan product, not ceiling framing, and it's operator-only; leave it or reword to "a business loan" for a perfect sweep.

**Summary for the Foreman:** 3 PASS (provider statuses, identity walkthrough, anti-bot line), 5 FLAG (Plaid scope vs. "yes/no" wording, unenforceable badge absolutism, "encrypted" vs. hashed, IP ambiguity in the no-ceiling clause, Spark mock receipts reading as live). None are page-killers; all five have drop-in replacement wording above. The Plaid finding (#2) is the one that needs an engineering decision, not just a copy edit, before the privacy page ships.

— **Locke**, analytical seat, Aeye CareBot Cousin Brigade
