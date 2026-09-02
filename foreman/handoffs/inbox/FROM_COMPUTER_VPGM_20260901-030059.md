# FROM COMPUTER — VPGM

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_WERKLES_LIVE_SITE_RED_TEAM_THUFIR_TERMINAL_CHASER_20260901_v0.1_20260901-0300.md
- PACKET_SHA256: 4697ea708afe509c90adefd29a58a42cedee959fee11c2f767f47556b822609a
- SUBMISSION_ID: VPGM:COMPUTER:4697ea708afe
- Posted at: 2026-09-01T03:00:07.733Z
- Harvested at: 2026-09-01T03:00:59.948Z
- Extracted via: div.prose
- Reply sha256: 8ba2a889643d4fba8520e2d967c304bc8e5b872fb8dfb360456d5748f228883a
- Reply chars: 10072
- CUSTODY: CUSTODY_CHALLENGE_NOT_ECHOED — Substantive reply present, but the packet's challenge nonce CUSTODY-COMPUTER-C07A90011A0D32E44AF62A0713E0284A was not echoed. The seat answered without confirming which packet it holds.

---

The walk returned solid rendered evidence. Formatting the receipt now.

FROM_COMPUTER_WERKLES_LIVE_SITE_FULL_RED_TEAM_20260831_v0.1.md
Provider / task execution context

Cousin identity: Computer / Thufir (CBCC seat), performed personally in this seat. The walk was executed through Computer's browser arm against the live production site; no subagent, no new persona, no new environment. Login/payment gates were not crossed. No forms were submitted. No account created. No credentials entered.

Pages personally walked (all live, all https://werkles.com/…): /, /#lanes, /spark, /proof, /bellows, /membership, /pricing, /privacy, /terms, /formation, /bellows/intake, /bellows/recommendations, /onboarding, /login, /signup, /bellows/personal/supplier-comparison. Login-gated destinations reached and stopped at the gate: /dashboard, /dashboard/blueprints, /dashboard/intros, /dashboard/billing, /dashboard/crucible (each correctly redirected to /login?next=…). 404-verified paths: /intake, /recommendations, /workshop, /match-deck, /matches, /public-bellows, /personal-bellows, /crucible, /how-it-works, /about, /people, /story, /home (custom "That bench is empty." page).

Evidence basis: rendered DOM, page titles, verbatim strings quoted with exact URL, console errors observed, 320px viewport measurement, and network-fetch validation of below-fold images that reported naturalWidth=0 in the DOM at query time.

G1 — Verdict

PATCH.

The site is materially stronger than the packet's KNOWN GAPS suggested. Maria copy is fully absent from every walked route (0 hits site-wide). The section-signature discipline holds. The doctrine-safe verbatim strings that were intended for this cycle (From a messy need to a usable next move., Werkles should earn its place in your week.) render exactly as designed on the homepage. No wealth-ranking, no compatibility score, no ranked leaderboard, no cap-table language, no percentage ownership, no wage rate, no financing instrument, no drafted contract clause was observed anywhere. Header continuity holds across every walked route (canonical primary nav People → Story → Proof → Bellows → Membership → Sign in → Discover what you need, byte-identical order on every page).

PATCH, not STOP, because none of the observed defects is a doctrine violation; they are integrity gaps that erode the exact "verify before you rely on anyone" pitch the site is built on. PATCH, not GO, because two defects — one legal-integrity, one security-configuration — must not sit in production while the site tells members its own doctrine is verify-first.

G2 — Observed production facts vs researched context
Observed (with URL and verbatim string)

Homepage / H1: "Figure out your next step. Build something real." Sub-headline: "Whether you are starting an idea, growing a business, solving a problem, or looking for the right help, Werkles helps you understand the situation, explore honest options, and move forward with confidence." Primary CTAs: "Let us help you discover what you need" and "See how evidence works".

Homepage doctrine H2s render verbatim: "Werkles should earn its place in your week." and "From a messy need to a usable next move." and "Check what matters before you rely on it." and "Pay for the floor — not the fantasy." and "Safe to act, not alone."

Section trio H3: "WHAT IT IS" / "WHY YOU NEED IT" / "WHY FOUNDRY DUES" — the word "Foundry" appears without a first-explanation adjacent, a jargon-introduction gap per NN/g's "define jargon once, adjacent" rule (Nielsen Norman Group on jargon in interfaces).

Homepage negation string: "State the need. In your words — what you think is blocking you. No compatibility score." — this is the pre-code §3.3 no-numeric-score rule rendered on-surface. Doctrine-safe.

Six-lane cards H3: "Spark / Operator / Backer / Connector / Builder / Worker" on / and /formation. Lane taxonomy is a first-encounter term for a new visitor; explanation is embedded in the card body but not in a first-explanation adjacent to the label itself.

Membership /membership prices: "$9.99 a month", "$99/year", plus "$0 Free Werkler". Explicit disclaimer: "Membership adds tools and continuity. It does not guarantee a match, funding, approval, safety, or business success." and "Dues do not verify you, fund you, introduce you, or vouch for anyone else."

Membership page carries the bakery imagery family: alt text "Baker handing a paper bag across the counter to his first customer" and "Shop owner flipping her door sign to OPEN." No "Maria" string; no bakery narrative; the images are the real-object relief the human-rhythm pass installed.

Recommendations demo /bellows/recommendations shows a pre-filled example: "Need: I need a business partner and investor before I can buy the bakery equipment." with Squibb's response: "Squibb: You said partner and investor. The priced asset is already on the table. Partners show up faster when the machine is real." No Maria; the bakery is the ambient example.

Privacy /privacy and Terms /terms both display footer note: "Last updated July 31, 2026 — draft pending Operator review."

Privacy /privacy vendor table names Supabase (Live today), Vercel (Live today), Stripe (Ready — payments not yet live), Stripe Identity (Test integration — not yet live), Plaid (Sandbox — not yet live), Twilio (Planned — not connected yet). Explicit statements: "We do not sell your information. We do not run advertising networks on your data." and the "Not used to rank people" list including "Your bank balance, net worth, or how far you are above a financial eligibility threshold" and "How long you stare at a profile, scrolling, hovering, or ordinary card clicks" and guessed protected/sensitive traits.

Privacy /privacy verification-badge honesty: "Verification is in preview. No badge anywhere on Werkles yet reflects a live check — when that changes, this page changes first."

Privacy /privacy contact pattern: routes to /bellows/intake rather than a monitored privacy@werkles.com alias.

No legal-entity name (LLC/Inc./PBC) is present on /privacy, /terms, or the site footer.

Intake /bellows/intake banner: "Intake submission is temporarily closed while secure account storage is being connected." and "Your answers stay in this browser while account submission is paused."

Onboarding /onboarding presents a live-looking "Lane / Trade or industry / ZIP" form with a "Save and continue" button, without a matching browser-only-draft warning. Not submitted.

Console error on every page load: Content-Security-Policy violation blocking fonts.googleapis.com/css2?family=DM+Sans…&family=Fraunces…; the site falls back to system fonts. Fires on / and /login confirmed.

Header semantics: exactly one #werkles-site-header per rendered route; canonical primary nav People → Story → Proof → Bellows → Membership in identical order across all 15+ walked routes. However, document.querySelectorAll('header').length returns 8 on / and 2 on /login — extra <header> elements are semantic-HTML card headers, not duplicate navigation.

320px viewport: 16-pixel scrollWidth overflow measured against clientWidth = 320; DOM sweep found zero offending elements; likely a device-pixel-ratio artifact but a spot-check on a real narrow device is warranted. All primary nav items reachable, no text overlap.

Below-fold images (people-spark-idea-moment.jpg, people-vet-exam.jpg, werkles-industry-accountant.png, etc.) reported naturalWidth=0 in the DOM at query time but returned HTTP 200 on direct fetch — lazy-loaded, not broken.

Lane imagery on homepage and /formation: three cohesive "REAL WORK LEAVES CLUES" photos read as purpose-shot; the six lane photos read as generic stock loosely fit to unrelated concepts (veterinarian → Operator, accountant → Backer, florist → Builder, dog-walker → Worker).

Every intended target string from the packet renders where intended; three specific persistence and doctrine strings that this cycle's receipts anticipated (Saved to your Werkles account., Saved in this browser only., Not saved yet., We found work from this browser., Funds verified — date only; no public balance ranking, Practice response only., Apply the partner's synthetic response, Werkles recovered the latest answers saved in this browser., Only mutual decisions cross this line., Your story won't be Maria's., Maria thought she needed customers.) do not appear on the walked public surface. Two possible reasons: they live behind the login gate, or they were staged for a downstream candidate and are not on this deployment. Either is doctrine-safe by omission — the strings only harm if they render dishonestly. Their absence is not itself a defect.

Researched context (cited primary sources only where needed)

Legal entity + monitored contact for data-subject requests is a soft standard for consumer-facing sites in every US state comprehensive privacy law and a hard standard under CCPA/CPRA: Cal. Civ. Code §1798.130(a)(1)(A) requires that notice at collection identify the business and disclose consumer rights, with a designated request pathway. Routing DSR requests to a product intake form is not per se a violation; it becomes a violation the first day the request path is not honored inside statutory windows.

Plain-language and clear-consequence button rules are grounded in WCAG 2.2 SC 3.3.2 Labels or Instructions and SC 3.2.4 Consistent Identification. Werkles's Continue buttons consistently name their destination on /spark ("Continue → Next: the room it happens in →") — this is a quiet strength the walk confirmed. Onboarding's bare "Save and continue" without an on-surface note about where it saves is the one open exception.

Multiple <header> landmarks are permitted by HTML; screen-reader users navigating by landmark benefit when non-primary headers are labeled or promoted to <section> with an aria-labelledby, per WAI-ARIA authoring practices for landmark regions. Werkles's site header is the only landmark used for navigation; the other <header> elements are card chrome. Low-priority accessibility polish; not a defect.

---

## Relay metadata

```json
{
  "schemaVersion": null,
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "COMPUTER",
  "cousin": "COMPUTER",
  "VERDICT": null,
  "CONFIDENCE": null,
  "UNKNOWNS": null,
  "source_packet_id": "TO_COMPUTER_VPGM_WERKLES_LIVE_SITE_RED_TEAM_THUFIR_TERMINAL_CHASER_20260901_v0.1_20260901-0300",
  "source_packet_file": "TO_COMPUTER_VPGM_WERKLES_LIVE_SITE_RED_TEAM_THUFIR_TERMINAL_CHASER_20260901_v0.1_20260901-0300.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": "Independent red-team review — WERKLES_LIVE_SITE_RED_TEAM_THUFIR_TERMINAL_CHASER_20260901 v0.1. Findings only.",
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, account creation, provider activation, production mutation, push, deploy, or delegation.",
  "nextActionHash": null,
  "currentStateHash": null,
  "packet_sha256": "4697ea708afe509c90adefd29a58a42cedee959fee11c2f767f47556b822609a",
  "submission_id": "VPGM:COMPUTER:4697ea708afe",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "CUSTODY_CHALLENGE_NOT_ECHOED",
  "custody_token_echoed": null,
  "receiver_computed_hash": null,
  "generated_at": "2026-09-01T03:00:59.948Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
