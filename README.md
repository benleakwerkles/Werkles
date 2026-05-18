# Werkles Prototype

Werkles is a static web app prototype for matching workers, trade operators, and small capital partners who want to start, buy, or scale local businesses together.

Open `index.html` in a browser to run it. No install step is required. The current site is deployed on Vercel and can run as static HTML, CSS, and JavaScript.

Current prototype:

- Worker / builder, trade operator, capital partner, and hybrid profile lanes
- Matching by role fit, trade arena, geography, capital fit, skills, goals, and verification
- Profile controls for capital available, capital needed, skills, and outcomes
- Match deck with score explanations
- Intro queue
- Verification checklist
- Canvas-based market map
- Local browser storage for profile, intro queue, and beta signup capture
- Founder brief copy action for sharing a profile summary

This prototype is intentionally an introductions product. Real investment, lending, securities, ownership, KYC, and AML flows should be designed with legal and financial professionals before any production launch.

Next production step: migrate profile, intro, and beta signup data from local browser storage to Supabase.

AI collaboration packet:

- `AI_HANDOFF.md` explains the product, codebase, current scope, risks, and next milestones.
- `AI_TEAM_PROMPTS.md` contains copy/paste prompts for Gemini Pro, DeepSeek, Perplexity Max, and Codex integration.
