# Education Forge

> **Deprecated naming:** this document used Bellows to mean autonomous text worker. Current naming: Bellows is the learning area; background content worker should be called Education Forge / Curriculum Forge / Content Forge.

Education Forge is the **internal** text-only worker for curriculum drafts destined for the **Bellows** learning surface (`/bellows`).

**Bellows** is the public learning product surface at `/bellows` — where Werklers learn anti-guru, de-gating, practical operator, business, and financial material, plus SOPs and templates. See `foreman/SITE_MAP.md`.

**Squibb** is the guide/host inside Bellows — helpful, reality-checking, never snide, not a sales character.

Education Forge may eventually feed Bellows content after human review, but this scaffold does not publish content or touch production pages.

## Scope

This scaffold may write only to:

- `content/education/drafts/`
- `foreman/education-forge-output/`
- `education-forge/`

It must not write directly to:

- `app/`
- `lib/`
- `company/`
- `supabase/`
- API routes

## Hard Stops

- Do not publish Bellows content to `/bellows` or other live routes.
- Do not deploy.
- Do not push.
- Do not enter or print secrets.
- Do not run Education Forge live without Operator gate.
- Do not run indefinitely.
- Do not create live Stripe products.
- Do not apply SQL from this lane.

## Cost And Rate Rules

- `MAX_DRAFTS_PER_RUN=1`
- `MAX_SOURCES_PER_DRAFT=8`
- `DAILY_COST_LIMIT_USD=5`
- Stop after one draft by default.

## Output Standard

Drafts must be original explanations with source links and a clear educational disclaimer. No financial, legal, tax, or investment advice. Human review is required before publishing to Bellows.
