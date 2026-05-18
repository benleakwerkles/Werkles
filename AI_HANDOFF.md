# Werkles AI Team Handoff

Use this file to brief Gemini, DeepSeek, Perplexity, or any other review agent on the current Werkles prototype.

## One-Sentence Product

Werkles is business partner matching for workers, trade operators, and small capital partners who want to start, buy, or scale Main Street businesses together.

## Current State

- Domain: `werkles.com`
- Hosting: Vercel
- Repo: GitHub repo connected to Vercel
- App type: static HTML/CSS/JavaScript prototype
- Backend: none yet
- Persistence: browser `localStorage`
- Current files:
  - `index.html`: app structure and UI
  - `styles.css`: visual design
  - `app.js`: mock profiles, matching logic, local storage, intro queue
  - `README.md`: project overview
  - `DEPLOY.md`: deploy notes
  - `vercel.json`: static deploy headers

## Product Thesis

Banks, large employers, and traditional capital markets leave a lot of capable people stuck. Werkles helps undervalued workers, operators, and small-money investors find each other laterally:

- A plumber with field skill can meet someone with startup capital and sales ability.
- A warehouse floor lead can meet someone who needs operations talent and wants to offer equity.
- A small investor can meet real operators instead of passively chasing paper deals.
- A dispatcher, bookkeeper, closer, or crew lead can turn invisible company-building skill into ownership opportunity.

The MVP should be an introductions and trust platform, not a money-transfer or securities platform.

## Current UX Direction

The desired tone is energetic, credible, and human. Avoid:

- sterile procurement dashboard energy
- beige corporate sameness
- generic fintech hero copy
- overexplaining how the UI works inside the UI
- anything that makes users feel like they are filling out government paperwork

Prefer:

- match/deck mechanics
- strong but practical copy
- clear trust signals
- proof without snobbery
- fast profile tuning
- visible reasons behind match scores
- a little swagger, but not parody

## Profile Lanes

1. Worker / builder
   - Floor leads, techs, dispatchers, closers, crew bosses, back-office operators, customer-facing workers.
   - They may bring skill, trust, customer relationships, process knowledge, or management capability instead of cash.

2. Trade operator
   - Licensed tradespeople, mechanics, service pros, estimators, and owner-operators.
   - They bring craft, licenses, equipment, field credibility, and technical judgment.

3. Capital partner
   - Small investors, sales operators, admin partners, bookkeepers, marketers, or people with cash and company-building skill.
   - They bring capital, systems, sales, hiring, admin, or finance.

4. Hybrid
   - People with more than one piece of the puzzle who still need a missing complement.

## Current Matching Inputs

- Role / lane
- Industry / arena
- City and state
- Radius
- Capital available
- Capital needed
- Skills
- Goals
- Verification checks

## Current Matching Heuristics

The prototype scores matches based on:

- complementary roles
- same industry
- same state
- user skills covering candidate needs
- candidate skills complementing user gaps
- shared goals
- capital fit
- verification strength

This is intentionally explainable. Do not replace it with opaque AI matching yet. Improve the logic only if the explanation remains legible to users.

## Compliance Frame

Werkles should stay framed as:

- partner discovery
- introductions
- trust and verification
- profile matching
- readiness and fit assessment

Werkles should not yet be framed as:

- a securities marketplace
- a crowdfunding portal
- a lending platform
- a broker-dealer
- a money movement platform
- legal, tax, or investment advice

Any real investment, lending, equity, revenue-share, or acquisition workflow needs legal review before production.

## Proposed AI Team Roles

### Codex

Role: build captain and repo owner.

Responsibilities:

- keep one coherent implementation path
- edit the repo
- run checks
- deploy through GitHub/Vercel
- turn reviewed recommendations into code
- maintain product scope discipline

### Gemini Pro

Role: product and UX strategist.

Ask Gemini for:

- better onboarding questions
- user personas
- stronger first-run experience
- clearer trust and verification language
- copy improvements
- interaction flow critique
- ways to make the site feel engaging without becoming unserious

Do not ask Gemini to own final implementation.

### DeepSeek

Role: engineering and risk critic.

Ask DeepSeek for:

- code review
- matching algorithm critique
- data model proposal
- Supabase schema review
- auth/security review
- privacy risks
- edge cases
- tests to add before production

Ask it to be blunt and specific. It should return file-level recommendations or schema changes, not broad inspiration.

### Perplexity Max

Role: research scout.

Ask Perplexity for:

- competitor landscape
- current regulatory/compliance risks
- vendor research for identity, license, work-history, funds, and background verification
- pricing and integration notes
- market-entry research by trade and geography
- sources and citations

Ask it to distinguish facts, assumptions, and legal questions for an attorney.

## Standard Return Format For Other AIs

Ask every external model to respond in this structure:

```text
1. Best current read
2. What is working
3. What is weak or risky
4. Highest-leverage changes now
5. Later / not yet
6. Specific edits, schema, copy, or research findings
7. Questions for Ben
```

## What Not To Do

- Do not add payment flows yet.
- Do not ask for GoDaddy, Vercel, GitHub, bank, or identity credentials in chat.
- Do not invent fake legal certainty.
- Do not add a complex backend before the product flow is strong.
- Do not let every AI produce a separate vision; bring their output back to Codex for integration.

## Immediate Next Build Milestones

1. Polish the live static match-deck experience.
2. Add real beta capture through Supabase.
3. Add authentication.
4. Replace mock profiles with database profiles.
5. Add intro request storage and admin review.
6. Add verification status fields.
7. Add a private admin queue for identity/work/funds/license review.
8. Validate the product with a narrow first market, such as one metro and one or two trades.

## Sharing Instructions

Give external AIs:

1. This `AI_HANDOFF.md` file.
2. The live URL: `https://werkles.com`
3. The GitHub repo link, if they can browse code.
4. The specific role prompt from `AI_TEAM_PROMPTS.md`.

If they cannot access GitHub, paste `index.html`, `styles.css`, and `app.js` after this handoff.
