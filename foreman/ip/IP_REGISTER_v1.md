# IP Register

Status: **RECORD ONLY — v1**  
Created: 2026-06-13  
Authority: Operator inventory — not legal counsel, not trademark advice, not filing guidance.

**Rules for this file**

- Record only. No legal conclusions. No trademark opinions. No filing recommendations.
- No deletions — supersede or mark retired; append corrections with date.
- Unknown dates: **APPROX** or **UNKNOWN**.
- Include source file or thread when known.
- Chat memory alone is not a source — cite repo path or dated handoff.

---

## Product Names

| Name | Category | First Known Use | Status | Notes | Source |
|------|----------|-----------------|--------|-------|--------|
| **Werkles** | Product / company | APPROX 2025 (repo migration era) | active | Private partner-discovery and verification-gated networking platform; public domain `werkles.com` | `README.md`, `company/WERKLES_PRODUCT_THESIS.md` |
| **Aeye** | Network / crew umbrella | APPROX 2026-05-30 | active | Internal name for multi-cousin AI network (Edge tabs, relay, role sync); not public product brand | `foreman/crew-dispatch/EDGE_DISPATCH_BAY.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `foreman/handoffs/outbox/TO_SKYBRO_RELAY_ROLE_AWARENESS_SYNC_v0.1_20260531-1650.md` |
| **SoleDash** | Operator cockpit UI | 2026-06-12 | active | Canonical user-facing operator workflow surface at `/soledash`; not Speaker, not GimpDash | `foreman/SOLEDASH_v1.md`, `app/soledash/`, `soledash.cmd` |
| **GimpDash** | Dispatch / routing UI | APPROX 2026-05-31 | active | GD intent router UI at Foreman `:4317/#gimpdash`; dispatch plumbing, not operator home | `foreman/SOLEDASH_v1.md`, `foreman/gd-intent-router/gimpdash.html`, `gimpdash.cmd` |
| **Speaker** | Constitutional office / reasoning UI | 2026-06-07 (charter ratified) | active | Causal memory office; UI at `:4317/#gd-speaker`; separate from GD routing | `foreman/speaker/SPEAKER_CHARTER.md`, `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md` |
| **Squibb** | Mascot / guide persona | APPROX 2026-05-28 (approved) | active | Single canonical brass workshop owl; Crucible foreman + Bellows host; guide-scale not protagonist | `foreman/MASCOT_RULES.md`, `lib/copy.ts` (`squibb`) |
| **Foreman** | Infra control server | APPROX 2026-05-28 | active | Local control server `:4317`, cockpit sync, dispatch prep, Ghost Forge operator lane; Codex role alias | `foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md`, `scripts/foreman/foreman-control-server.mjs`, `foreman/AI_COUSINS_PROTOCOL.md` |
| **Bellows** | Public learning product surface | APPROX 2026-05-26 (site map) | experimental | Anti-guru lessons, SOPs, templates at `/bellows`; Squibb hosts; shell not full build | `foreman/SITE_MAP.md`, `app/bellows/` |
| **Crucible** | Member verification center | APPROX 2025–2026 (app scaffold) | active | Verification / proof workflow at `/dashboard/crucible`; preview-blocked in APP_INFRA | `app/dashboard/crucible/`, `lib/crucible.ts`, `foreman/MASCOT_RULES.md` |
| **Foundry Dues** | Membership product name | APPROX 2026 (monetization v0.2) | active | Legal label: membership subscription; nav label "Dues" | `company/WERKLES_MONETIZATION.md`, `lib/site-nav.ts`, `/membership` |
| **Human Gate** | Governance doctrine term | APPROX 2026-05 (cockpit era) | active | Authority/judgment/money/credentials/production moves requiring Ben; cockpit anchor | `foreman/HUMAN_GATES.md`, `company/WERKLES_CONSTITUTION.md` |
| **Leverage Matching** | Matching doctrine (working name) | UNKNOWN in repo | experimental | **Naming drift:** repo canon uses **Match Stacking**, **Need Translation**, **Not-Matching Matching** — not exact string "Leverage Matching" | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`, `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md` |
| **Leverage Diagnosis** | Operator doctrine term | UNKNOWN in repo | experimental | Record-only seed term for diagnosing highest-leverage constraint or next move; no legal conclusion | `foreman/ip/IP_REGISTER_v1.md` |
| **Leverage Inventory** | Operator doctrine term | UNKNOWN in repo | experimental | Record-only seed term for inventorying available leverage assets, constraints, and moves; no legal conclusion | `foreman/ip/IP_REGISTER_v1.md` |
| **Leverage Hypothesis Testing** | Operator doctrine term | UNKNOWN in repo | experimental | Record-only seed term for testing leverage assumptions before committing effort; no legal conclusion | `foreman/ip/IP_REGISTER_v1.md` |
| **Ghost Forge** | Internal image worker | APPROX 2026-05-27 (approved lanes) | active | Cloud image batch worker; Render service `werkles-ghost-forge1`; human-gated spend | `ghost-forge-worker/README.md`, `foreman/LANES.md`, `foreman/gates/APPROVAL_LOG.md` |
| **Ender** | AI cousin seat (Claude) | APPROX 2026-05-30 (role sync packets) | active | Art direction, experience, emotional arc; internal seat name | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Petra** | AI cousin seat (ChatGPT Comptroller) | APPROX 2026-05-30 | active | Scope, GO/NO-GO, gates, red team | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Skybro** | AI cousin seat (Gemini) | APPROX 2026-05-30 | active | Strategy, philosophy, positioning, narrative arc | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/platform-instructions/GEMINI_SKYBRO_GEM_INSTRUCTIONS.md` |
| **Bean** | AI cousin seat (DeepSeek) | APPROX 2026-05-30 | active | Hostile audit, trust/compliance surfaces | `foreman/AI_COUSINS_PROTOCOL.md` |
| **Thufir** | AI cousin alias (Perplexity / Computer) | APPROX 2026-06-12 (SoleDash crew labels) | active | **Alias drift:** registry lists **Computer**; SoleDash UI uses **Thufir (Computer / Perplexity)** | `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `lib/soledash/cockpit-data.ts` |
| **Maker** | AI cousin seat (Cursor) | APPROX 2026-05-30 | active | Bounded UI wiring, local preview, copy implementation | `foreman/AI_COUSINS_PROTOCOL.md`, `AGENTS.md` |
| **Dink** | Builder / infra cousin alias | APPROX 2026-06-08 (Speaker entries) | active | Scripts, plumbing, local hands; also **Bulldozer**, **Codex** in registry | `foreman/speaker/entries/DRAFT_20260608-tool-mortality.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |

### Additional product names (repo discoveries)

| Name | Category | First Known Use | Status | Notes | Source |
|------|----------|-----------------|--------|-------|--------|
| **GD Intent Router** | Internal routing system | 2026-06-06 (proven test run) | active | Mission-class registry + CLI; internal name for GimpDash backend | `foreman/gd-intent-router/GD_INTENT_ROUTER_V1.md`, `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |
| **GD** | Shorthand for intent router | 2026-06-06 | active | Not user-facing brand; "Governor and router" | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |
| **Education Forge** | Internal curriculum worker | APPROX 2026-05-26 | active | Text-only curriculum scaffold; **not** Bellows, not a public route | `foreman/SITE_MAP.md`, `education-forge/`, `foreman/MASCOT_RULES.md` |
| **Crew Dispatch Console** | Dispatch UI v2 | APPROX 2026-05-30 | active | Packet prep; stops before Send | `foreman/crew-dispatch-console/DISPATCH_CONSOLE_v2.md` |
| **Aeye Crew Bay** | Browser dispatch surface | APPROX 2026-05-31 | active | Edge tabs for cousin circuit | `foreman/crew-dispatch/README.md`, `open-aeye-crew.cmd` |
| **Match Deck** | Member app feature | APPROX 2025–2026 | active | Dashboard matching UI | `app/dashboard/`, `README.md` |
| **Blueprint** | Product pattern | APPROX 2025–2026 | active | Multi-member venture room pattern; center of product thesis | `company/WERKLES_PRODUCT_THESIS.md` |
| **Spark** | Lane + narrative act | APPROX 2026-06-06 (narrative arc) | active | Lane name + Act 1 narrative beat; maps Worker concept in match doctrine | `lib/copy.ts` (`lanes.spark`), `foreman/IMAGERY_DIRECTION.md` |
| **Sherlock** | AI cousin seat | APPROX 2026-06-06 (dossier run) | active | Investigation, synthesis, artifact recovery | `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_*` |
| **Computer** | AI cousin seat (Perplexity) | APPROX 2026-05-30 | active | Doctrine research; see **Thufir** alias conflict | `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Codex** | Foreman role alias | APPROX 2026-05-28 | active | Cockpit sync; overlaps **Foreman** naming | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Relay Courier** | Delivery plumbing | APPROX 2026-05-31 | active | Tab focus + paste prep; blind until Thread Registry | `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md` |
| **Thread Registry** | Identity plumbing | APPROX 2026-06-08 (Speaker drafts) | experimental | Canonical thread identity for packets | `foreman/speaker/CAUSAL_LEDGER.md` |
| **Operator Dashboard** | Legacy cockpit markdown | 2026-05-31 | retired | Superseded in intent by **SoleDash** for daily workflow; markdown may remain | `foreman/OPERATOR_DASHBOARD.md`, `foreman/SOLEDASH_v1.md` |
| **BLDer** | Legacy machine name | APPROX 2026-05-31 (forensics) | retired | Earlier laptop build surface; not same as Betsy | `foreman/MACHINE_TOPOLOGY.md`, `foreman/reviews/LOCAL_BLD_OPERATOR_GIMP_DASH_FORENSICS.md` |
| **Squibb Recommendation Surface** | UI concept | 2026-06-13 | experimental | Bellows sub-route `/bellows/recommendations`; UI only, no engine | `lib/squibb/recommendations.ts`, `app/bellows/recommendations/` |

---

## Systems & Frameworks

| Name | Description | Owner Layer | Status | Source |
|------|-------------|-------------|--------|--------|
| **LOCAL HANDS READBACK** | Mandatory session-start readback: machine, repo, branch, commit, tree, localhost before repo/runtime mutation | Crew / constitution | active | `foreman/EXECUTION_CONTEXT_RULES.md`, `company/WERKLES_CONSTITUTION.md`, `AGENTS.md` |
| **Human Gate** | Cockpit rule anchor classifying Ben-only authority vs non-gate technical proofs | Governance | active | `foreman/HUMAN_GATES.md` |
| **Leverage Matching** | *(Working name — see naming drift)* Formation / need-translation architecture before people-matching | Product doctrine | experimental | See **Match Stacking & Need Translation** — `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| **Speaker Recommendation Constitution** | *(Seed name — not found as exact repo artifact)* Intended doctrine for recommendation governance | Speaker / product | experimental | **No file with this exact title.** Closest: `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`, Squibb Recommendation Surface v1 UI |
| **Operator Cockpit** | Daily operator workflow surface doctrine (machine, next steps, gates, crew) | Foreman / SoleDash | active | `foreman/SOLEDASH_v1.md`, `foreman/FOREMAN_RULES.md` (Operator Cockpit Mode), `foreman/finance/FINANCE_COCKPIT_REQUIREMENTS.md` |
| **Crew Dispatch Protocol** | Packet prep, outbox/inbox, human Send gates, cousin routing habits | Foreman / dispatch | active | `foreman/crew-dispatch-console/DISPATCH_CONSOLE_v2.md`, `foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md`, `foreman/handoffs/outbox/README.md` |
| **AI Cousins Protocol** | Role boundaries, source hierarchy, execution context for all cousins | Governance | active | `foreman/AI_COUSINS_PROTOCOL.md` |
| **Machine Topology Registry** | Physical machine ↔ hostname ↔ repo path ↔ forge role binding | Foreman / ops | active | `foreman/MACHINE_TOPOLOGY.md` |

### Additional systems (repo discoveries)

| Name | Description | Owner Layer | Status | Source |
|------|-------------|-------------|--------|--------|
| **Match Stacking & Need Translation** | Layer 0 need translation + five-layer match stack doctrine | Product | active (DRAFT) | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| **GD Intent Router workflow** | intent → mission class → role routing → receipts → synthesis → Operator Brief | Foreman / GD | active (DRAFT) | `foreman/gd-intent-router/GD_INTENT_ROUTER_V1.md` |
| **Human Consumable Output Rule** | Operator Brief 5-section definition of done for GD runs | Foreman / GD | active | `foreman/gd-intent-router/HUMAN_CONSUMABLE_OUTPUT_RULE_V1.md` |
| **Execution Context Rules** | LOCAL_SALLY_WINDOWS vs CURSOR_CLOUD_CONTAINER evidence locality | Crew | active | `foreman/EXECUTION_CONTEXT_RULES.md` |
| **Iron Firewall** | Monetization boundary — sell forge/tools, not user-to-user deals | Company law | active | `company/WERKLES_MONETIZATION.md` |
| **Multi-Member Blueprint Pattern** | Venture-centered room, not hero-user profile | Product | active | `company/WERKLES_PRODUCT_THESIS.md` |
| **Workshop Facets** | Route/panel atmosphere tokens within one building | Design system | active | `lib/workshop-facets.ts`, `foreman/SITE_STYLE_APPROVED_v0.6.md` |
| **Four-act narrative journey** | Spark → Space → Forge → Foundry public story spine | Marketing / UX | active | `foreman/IMAGERY_DIRECTION.md`, `lib/narrative-arc.ts` |
| **Gate Review UI Protocol** | UX classification for human vs non-gate stops | Governance | active | `foreman/HUMAN_GATES.md` |
| **SPEAKER_REVIEW_MISSING** | Mark builds that changed routing/copy without Speaker ledger check | Speaker | active | `foreman/speaker/SPEAKER_DOCTRINE.md` |

---

## Product Concepts

| Concept | One-line description | Status | Source |
|---------|---------------------|--------|--------|
| **Find the highest-leverage next move** | Operator workflow goal — rank next actions by leverage, not activity | active | `foreman/SOLEDASH_v1.md` (next steps), `lib/soledash/workflow.ts`, hero copy in `lib/copy.ts` |
| **Human Adaptation Thesis** | System must adapt to human context compression, thread drift, and Operator burden | experimental (DRAFT) | `foreman/speaker/entries/DRAFT_20260607-human-adaptation-thesis.md` |
| **Operator Network** | *(Seed — exact phrase not found)* Network of serious builders/operators with verification | experimental | Related: product thesis "private partner-discovery… platform" — `company/WERKLES_PRODUCT_THESIS.md` |
| **Post-match SaaS** | *(Seed — exact phrase not found)* Software revenue after formation/match, not transaction fees | experimental | Related: monetization picks-and-shovels — `company/WERKLES_MONETIZATION.md` |
| **Verification Receipts** | Store scoped third-party verification outcomes, not raw sensitive documents | active | `docs/architecture.md`, `README.md`, `AI_HANDOFF.md` |
| **Concierge Matching** | *(Seed — exact phrase not found)* High-touch guided matching / operator-assisted intros | experimental | No canonical repo file; related intro request flow — `app/dashboard/intros/` |
| **Any Person Can Become Anything** | Narrative arc: becoming over static identity; wrong guess → real bottleneck → proof → move | active | `foreman/IMAGERY_DIRECTION.md`, `FROM_MAKER_SPEAKER_UX_REVIEW_2026-06-10.md`, Ender imagery packets |
| **Mythic Capitalism** | Brand voice: industrial warmth, anti-gatekeeper, dream logic with steel under it | active | `company/WERKLES_CONSTITUTION.md`, `company/WERKLES_BRAND_VOICE.md`, `lib/copy.ts` |

### Additional concepts (repo discoveries)

| Concept | One-line description | Status | Source |
|---------|---------------------|--------|--------|
| **Not-Matching Matching** | Need translation before people; Werkles is formation not Tinder for founders | active (DRAFT) | `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md` |
| **Layer 0 Need Translation** | Translate stated need into nearer bottleneck before match stack | active (DRAFT) | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| **Squibb scout behavior** | Points to overlooked option; asks once; does not decide or chatbot | active | `lib/copy.ts` (`squibb.scout`), `foreman/IMAGERY_DIRECTION.md` |
| **Causal memory** | Speaker preserves why/cost/lesson, not just events | active | `foreman/speaker/SPEAKER_CHARTER.md` |
| **Compression loss** | Insight lost when threads summarize without gate/cause preservation | active | `foreman/speaker/SPEAKER_DOCTRINE.md` |
| **Foundry Router** | Internal-only candidate name for GD public surface | experimental | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |
| **Company Builder Console** | Candidate user-facing name family for GD UI | experimental | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |

---

## Visual / Brand Assets

| Asset | Description | Status | Source |
|-------|-------------|--------|--------|
| **Industrial-Chic Metallurgy** | *(Seed — exact phrase not in repo)* Workshop metallurgy aesthetic direction | experimental | **Not found in repo text.** Related: industrial warmth in Mythic Capitalism voice — `company/WERKLES_BRAND_VOICE.md` |
| **Forge Orange** | Atmospheric accent `#F6AD55` — forge fire, hero warmth; **not** CTA color | active | `foreman/DESIGN_SYSTEM.md` (`--werkles-forge-orange`) |
| **Patina Green** | *(Seed — exact phrase not in repo)* | experimental | **Not found.** Possible conflation with **owl-eye-green** `#5FD178` or teal tokens — `foreman/DESIGN_SYSTEM.md` |
| **Heat-Tint Purple** | *(Seed — exact phrase not in repo)* Brand violet family for W mark / hero | active | Canon tokens: `--werkles-violet`, `--werkles-violet-bright`, `--werkles-violet-deep` — `foreman/DESIGN_SYSTEM.md` |
| **Squibb Owl** | Brass workshop owl mascot — manual cutout path; Ghost Forge exploration drafts separate | active (asset pending) | `foreman/MASCOT_RULES.md`, `public/assets/mascot/`, `public/assets/draft/squibb-*` |
| **Documentary Icons** | Operator Marks / lane / site icon batches; draft PNG + SVG fallback | experimental (draft) | `foreman/ghost-forge/WERKLES_ICON_EXPLORATION_V2.md`, `public/assets/draft/icons/` |
| **Lane Token System** | Six-lane Monopoly-style brass tokens for Builder/Operator/Backer/Connector/Spark | experimental (draft) | `foreman/ghost-forge/WERKLES_LANE_TOKEN_SYSTEM_V1.md`, `public/assets/draft/lane-token-system-v1/` |

### Additional visual assets (repo discoveries)

| Asset | Description | Status | Source |
|-------|-------------|--------|--------|
| **Werkles brand mark (W duochrome)** | Violet + teal co-equal hero gradient | active | `foreman/DESIGN_SYSTEM.md` |
| **Workshop copper frame** | Copper/brass chrome for borders, badges, gear motifs | active | `foreman/DESIGN_SYSTEM.md` |
| **Brightened workshop v0.6** | Warm paper panels `#f6efe5`, dark ink on paper | active | `foreman/SITE_STYLE_APPROVED_v0.6.md` |
| **SiteIcon system** | PNG from draft icons when landed; SVG fallback | active | `foreman/SITE_STYLE_APPROVED_v0.6.md` |
| **Cockpit shell** | Wrapper pattern for pricing, membership, dashboard, crucible | active | `foreman/SITE_STYLE_APPROVED_v0.6.md` |
| **Four-act render batches** | Spark / Space / Forge / Foundry photography library | experimental (draft) | `foreman/ghost-forge/WERKLES_HOMEPAGE_SHOT_ARCHITECTURE_v1.md` |
| **Anyone narrative imagery** | Documentary people-at-work photography direction | experimental (draft) | `foreman/IMAGERY_DIRECTION.md`, `lib/anyone-narrative-imagery.ts` |
| **Formation grammar** | Incomplete → complete visual states for matching UI | active (design) | `FROM_ENDER_VISUAL_DIRECTION_LOCK_v1.md`, `foreman/IMAGERY_DIRECTION.md` |

---

## Open Questions

| Item | Decision Needed | Owner | Source / notes |
|------|-----------------|-------|----------------|
| Should **Aeye** become a product brand? | Public brand vs internal crew umbrella only | Ben (Operator) | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` §5–7; all cousin packets use AEYE Network Command |
| Should **Leverage Matching** be customer-facing? | Customer-facing name vs internal doctrine only; reconcile with Match Stacking / Need Translation | Ben + Petra | Seed name absent from repo; doctrine uses different terms |
| Should **Speaker** remain internal? | Internal constitutional office vs any user-visible "why we believe this" surface | Ben | `foreman/speaker/SPEAKER_CHARTER.md`; SoleDash shows gate labels not Speaker entries |
| Should **Squibb** be visible or invisible? | Guide-scale host vs hidden system voice | Ben + Ender | `foreman/MASCOT_RULES.md`, `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` §6 |
| **Thufir** vs **Computer** canonical cousin name | Single canonical seat label across UI, packets, registry | Ben | `foreman/speaker/AEYE_ROLE_REGISTRY.md` vs `lib/soledash/cockpit-data.ts` |
| **GimpDash** / **GD** public rename | Foundry Console / Company Builder vs keep internal | Ben | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` §5 |
| **Patina Green** / **Industrial-Chic Metallurgy** canon | Confirm whether seed terms map to existing tokens or are thread-only | Ben + Ender | Not found in repo; may predate DESIGN_SYSTEM v0.2 |
| **Speaker Recommendation Constitution** artifact | Create formal doc or merge into Speaker + Squibb surfaces | Ben | Seed name only; no repo file |
| **Operator Network** vs Werkles public positioning | Whether to use "network" language customer-facing | Ben + Petra | Product thesis uses "platform" / "formation" |
| **Concierge Matching** product scope | Human-assisted matching SKU vs pure software intros | Ben + Petra | No canonical spec in repo |
| Squibb **canonical cutout** vs Ghost Forge drafts | Which asset is production Squibb | Ben | `foreman/MASCOT_RULES.md` — manual cutout required |
| **Education Forge** → **Bellows** publish pipeline | How curriculum reaches public Bellows routes | Ben | `foreman/SITE_MAP.md` — human gate on publish |

---

## Register changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-06-13 | v1 created — seed entries + repo discoveries | Maker (Cursor) |
| 2026-06-13 | v1 finalized — added missing leverage doctrine seed entries | Foreman local hands |

---

## Index counts (v1)

| Section | Seed entries | Additional discoveries | Total rows |
|---------|--------------|------------------------|------------|
| Product Names | 22 | 15 | 37 |
| Systems & Frameworks | 8 | 10 | 18 |
| Product Concepts | 8 | 7 | 15 |
| Visual / Brand Assets | 7 | 8 | 15 |
| Open Questions | 4 | 8 | 12 |
| **Grand total** | **49** | **48** | **97** |

*Counts are inventory rows, not legal claims.*
