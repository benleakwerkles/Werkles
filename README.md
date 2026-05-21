# Werkles

Werkles is a Next.js + Supabase web app for matching builders, operators, backers, connectors, and sparks who want to start, buy, or scale Main Street businesses together.

The current GitHub repo is connected to Vercel for `werkles.com`. The app has started its migration from the static prototype to a typed Next.js App Router project while preserving the existing deployment path.

Current app:

- Public homepage with Mythic Capitalism copy from `lib/copy.ts`
- Signup/login screens using Supabase Auth client wiring
- Dashboard match deck route that calls `match_candidates_for_blueprint`
- Profile creation/edit page mapped to the Supabase `profiles` schema
- Intro request API and intro inbox scaffold
- Required account gate: driver's license front/back, face capture, and linked phone number before member activation
- Proof page: Werkles verifies members; members do not inspect each other's raw documents
- Beta signup route at `/api/beta`
- TTL cron route at `/api/cron/ttl`

This app is intentionally an introductions and verification-status product. Werkles is not a money-movement, lending, securities, broker-dealer, business-sale, or deal-facilitation platform.

Architecture direction:

- Web-first, mobile-first responsive Next.js app on Vercel.
- Supabase Postgres and Supabase Auth for the first functional backend.
- Email plus phone for two-factor authentication.
- Row-Level Security on every user-data table.
- Zero raw sensitive document storage in v0-v1; store verification receipts only.
- Subscription-only monetization for v0-v1. No transaction-based compensation, success fees, or deal-tied referral fees.
- Admin authorization is table-driven through `public.admin_users`; use `supabase/admin_bootstrap.sql` after Camelot Auth accounts and profiles exist.
- Production matching is scaffolded in Supabase with `public.match_candidates_for_blueprint(...)`, returning explainable factors without raw financial ranges.

Local setup:

```powershell
npm install
npm run dev
```

Required environment variables are listed in `.env.example`.

Architecture docs:

- `docs/architecture.md`
- `docs/adr/ADR-001-web-first-mobile-first.md`
- `supabase/migrations/00001_initial_schema.sql`

SEO quarantine:

- Production currently sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.
- Next metadata and static legacy HTML include matching robots meta tags.
- Remove those directives only when the brand, copy, and product positioning are ready for search indexing.

AI collaboration packet:

- `AI_HANDOFF.md` explains the product, codebase, current scope, risks, and next milestones.
- `AI_TEAM_PROMPTS.md` contains copy/paste prompts for Gemini Pro, DeepSeek, Perplexity Max, and Codex integration.
