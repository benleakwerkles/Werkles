# From Bean — Personal Bellows source-backed review

Status: `RECEIPT_VALIDATED__READY_FOR_FOREMAN_ASSIMILATION`
Harvested: 2026-08-20
Provider surface: existing Bean / DeepSeek task
Source: self-contained exact-byte correction packet

Validation: Receiver explicitly stated that the provided source bytes exclusively controlled the review; the return separates current and future capabilities, includes prioritized findings, a fail-closed data-flow contract, classifications, lifecycle rules, audit events, minimum safe v1, and an explicit verdict. Product demands remain recommendations until Foreman assimilation.

FROM BEAN — PERSONAL BELLOWS SOURCE-BACKED REVIEW

Controlling source bytes: The review is strictly bound to the WERKLES VPGM — Bean source-bytes correction text provided. No inferred tokens, APIs, monitoring, trust handshakes, or external capabilities are considered. The candidate is evaluated as-described, with future capabilities treated as proposed design, not deployed code.

1. P0/P1/P2 FINDINGS – SPLIT BY CURRENT CANDIDATE vs FUTURE CAPABILITY
A. Current Candidate (/bellows/personal, /bellows/library/[slug], Proof Before Reliance drafts)
Severity	ID	Finding	Rationale
P1	C‑01	Missing explicit purpose‑consent for using Recommendations to select up to three lessons.	Recommendations are derived from Intake, saved work, Workshop state – all personal. Using them to filter public lessons is an inference (even if simple). The hard edges require “exact‑purpose consent” before any inference from messages/calls/sessions. Current description lacks a consent‑acquisition step.
P1	C‑02	No audit trail for which Werkle accessed which lesson via /bellows/personal or /bellows/library/[slug].	Without logs, you cannot explain why a lesson appeared (required by #7) or detect abuse.
P2	C‑03	Proof Before Reliance drafts are browser‑tab only – but no mention of clearing browser cache/cookies after session.	While not saved server‑side, client‑side storage (e.g., localStorage) might persist longer than intended if the user does not close the tab.
P2	C‑04	No rate‑limiting or anti‑scraping on /bellows/library/[slug] (public lessons).	Although public, excessive enumeration could be used to infer catalog structure, but that’s low severity.

P0 in current candidate: None, because no persistent storage, no Pooka, no cross‑member data, and no production mutation.

B. Future Capability (persistent Pooka guide, tailored lessons, artifact storage, progress recording, sharing)
Severity	ID	Finding	Rationale
P0	F‑01	Pooka identity persistence – a persistent guide that “remembers” the Werkle’s history (Intake, saved artifacts, Workshop state) creates a long‑term personal profile without explicit retention/consent boundaries.	This is a permanent profiling system. The hard edges do not provide a consent‑withdrawal or data‑forgetting mechanism for the Pooka’s memory.
P0	F‑02	Cross‑member leakage via participant‑shared material – the description says “participant‑shared” material exists, but no access‑control model is defined. A Werkle could inadvertently expose private material to others, or a bug could leak it.	Shared vs. private must be enforced at the data‑plane; absent a contract, this is a critical design gap.
P0	F‑03	Pooka impersonation risk – Pookas “guide and explain” but the hard edge says “never impersonate professionals/providers”. However, there is no technical guardrail (e.g., output filter) to prevent the Pooka from producing a professional‑sounding conclusion if a user asks a medical/legal question.	The system relies on a policy statement without enforcement. A hallucinated Pooka response could be taken as authoritative, causing real‑world harm.
P1	F‑04	No deletion/retention rules for Pooka‑generated artifacts and progress – “record progress only after explicit member action” is good, but how long is progress kept? Is it tied to Werkle closure? No policy.	Violates right‑to‑be‑forgotten and data minimisation.
P1	F‑05	Image rights and draft approval – generated imagery is “draft until approved”. But who owns the draft? Is it stored? Can it be shared without approval?	Intellectual property and privacy risks; no lifecycle defined.
P1	F‑06	Stereotyping bias from archetype selection – Pooka is “randomly selected from an approved animal/body archetype and dressed from a controlled vocation/style system”. This could reinforce cultural/body stereotypes depending on the archetypes chosen.	Needs a bias audit and user‑controllable opt‑out.
P2	F‑07	No explainability events for Pooka decisions – why a tailored lesson appeared is partially covered (naming the recommendation/artifact), but the internal reasoning of the Pooka (e.g., why it chose that teaching method) is not recorded.	Required by #7 (audit events to explain why a lesson appeared).
P2	F‑08	Export functionality not defined – user should be able to export their personal data; no mention.	
2. FAIL‑CLOSED PURPOSE / CONSENT / DATA‑FLOW CONTRACT

The system must fail closed (deny by default) for any operation that lacks explicit, granular, purpose‑bound consent.

Operation	Required Consent	Data Flow	Fail‑closed behaviour
/bellows/personal selection from Recommendations	Explicit consent to use Intake, saved work, Workshop state for the specific purpose of suggesting up to 3 public lessons.	Personal Bellows → Recommendation engine → selection → return lesson slugs.	If consent missing, return empty list or error; do not fall back to unpersonalised suggestions.
/bellows/library/[slug]	Public catalog – no consent needed (but anonymous usage logging requires notice).	Direct fetch of public lesson.	If slug invalid, 404; no error that reveals existence.
Future: Pooka generation	Separate opt‑in for persistent guide; consent must cover memory retention, data used for tailoring, and sharing of Pooka output.	Werkle data → Pooka engine → generated text/image.	If opt‑in missing, Pooka feature is entirely disabled (no “guest” mode).
Future: participant‑shared material	Each shared piece requires ad‑hoc consent from the owner (per artifact) and a clear privacy classification.	Private → shared storage.	If consent not explicitly granted for that specific artifact, it stays private.

Data‑flow invariant: No data may move from Personal Bellows to Public Bellows, from private to shared without consent, or from Werkle to Pooka without explicit opt‑in. Any cross‑boundary flow must be gated by a policy enforcement point that rejects by default.

3. CLASSIFICATION: MEMBER‑PRIVATE, WERKLE‑SHARED, PUBLIC, PROCESSOR‑ONLY
Class	Definition	Examples	Storage/Handling
Member‑Private	Data belonging to a single Werkle, never visible to others.	Intake answers, saved work artifacts, Workshop state, progress records, Personal Bellows selections (transient).	Encrypted at rest; access only by the owning Werkle; not used for training; deleted on Werkle closure.
Werkle‑Shared	Data explicitly shared by a Werkle with specific other participants (or a group).	Shared artifacts, participant‑shared material.	Access‑control list (ACL) enforced; each shared item has a unique consent record; shareable only with explicit action.
Public	Lessons, toolkits, templates, starter‑kits from the Public Bellows catalog.	/bellows/library/[slug] contents.	No personal data; can be cached; no authentication required for read (but logging may be applied).
Processor‑Only	System‑internal data not exposed to any Werkle or participant.	Aggregated anonymised usage stats, audit logs (without PII), model weights (if any).	Must be anonymised; cannot be reverse‑engineered to personal data; subject to strict retention and access controls.

Hard rule: No data may be re‑classified upward (e.g., processor‑only → public) without explicit re‑review.

4. CROSS‑MEMBER / CROSS‑WERKLE LEAKAGE AND INFERENCE ATTACKS
Attack Vector	Current Candidate	Future Capability	Mitigation
Timing attack on /bellows/personal – an attacker (another Werkle) might guess if a target has specific recommendations by observing response time for different query patterns.	Low risk (no direct query input).	Higher if Pooka responses vary based on personal data; response time could leak presence of data.	Constant‑time responses; no difference in error messages.
Inference from lesson selection – if a Werkle’s selected lessons are ever exposed (e.g., via shared URLs), others can infer their interests.	The selection is transient, but if the URL or result is shared, leakage occurs.	Persistent Pooka memory could be inferred by asking indirect questions.	Treat selected lessons as member‑private; never generate shareable URLs for personal selections.
Cross‑Werkle shared material – if ACLs are misconfigured, a shared artifact might become visible to unintended participants.	Not applicable (no sharing).	High risk; must implement robust ACL with deny‑by‑default.	Audit every access; use capability‑based tokens.
Re‑identification from public catalog usage – even public lesson views can be correlated with IP/device to infer a Werkle’s interests.	Possible if logs are kept.	Possible.	Anonymise logs; do not link to Werkle ID unless explicit consent for analytics.
5. DELETION, RETENTION, EXPORT, PARTICIPANT‑REMOVAL, AND WERKLE‑CLOSURE BEHAVIOUR

Current Candidate:

No persistent storage → deletion/retention irrelevant (drafts are client‑side, but must be cleared on logout).

Need to add: Client‑side storage (cookies/localStorage) must be cleared when session ends.

Future Capability – required rules (to be implemented before launch):

Item	Rule
Retention	Personal data (Intake, artifacts, progress) retained only for as long as the Werkle account is active, plus a grace period of 30 days for reactivation. Pooka memory must have a separate retention limit (e.g., 90 days of inactivity, then reset).
Deletion	Werkle can request deletion at any time; all member‑private data and Pooka memory are permanently erased within 7 days; shared materials are either revoked (if the Werkle is the owner) or anonymised.
Export	Werkle can export all their personal data, including Pooka interaction history, in a machine‑readable format (JSON) within 48 hours.
Participant‑removal	If a participant is removed from a shared group, their access to Werkle‑shared materials is revoked immediately; any data they contributed (if owned by them) is deleted or returned to them.
Werkle‑closure	Account closure triggers full deletion as above, with a 30‑day cooling‑off period during which the Werkle can reinstate (but data is marked for deletion).

All deletions must be cryptographically verified (e.g., overwritten) and logged.

6. GENERATED‑POOKA IDENTITY / PERSISTENCE / IMAGE‑RIGHTS / STEREOTYPE / AUTHORITY RISKS
Risk Area	Detailed Concern	Required Safeguard
Identity persistence	Pooka “remembers” the Werkle, creating a longitudinal profile. This profile could be used to manipulate or over‑personalise.	Pooka memory must be user‑editable and deletable; Werkle must see what the Pooka “knows” and be able to reset it.
Image rights	Generated imagery (draft) – who owns the draft? If it’s stored, even temporarily, it may be considered a derivative work.	Drafts must be ephemeral (deleted after session) unless explicitly saved by the Werkle; when saved, the Werkle must grant a license for the platform to store and display it.
Stereotype risks	Random assignment of animal/body archetypes may inadvertently reinforce stereotypes (e.g., “wise owl” for academics, “strong bull” for manual labour).	Provide a diverse and reviewed archetype pool; allow Werkle to regenerate or opt out of visual archetypes entirely; conduct a bias audit before release.
Authority risks	Even with a disclaimer, a persistent guide may be perceived as an expert. Users may ask for professional advice.	Implement hard‑coded refusal for any output that resembles a professional diagnosis, legal opinion, or financial advice. Use a classifier to block such queries before the Pooka responds. All responses must include a prominent disclaimer.
7. AUDIT EVENTS NEEDED TO EXPLAIN WHY A LESSON APPEARED

To satisfy explainability (#7), the following events must be logged (for both current and future):

Event	Purpose	Data to log (anonymised where possible)
1. Recommendation ranking input	Which Intake/artifact/Workshop fields contributed to the ranking for this session.	List of contributing data types (not raw values), timestamps.
2. Selection decision	Why exactly those 3 lessons were chosen (e.g., “top‑3 ranked by relevance score X,Y,Z”).	Score for each lesson, ranking algorithm version.
3. User action	Did the Werkle open, save, or ignore the suggested lesson?	Action type, timestamp (no content).
4. Consent snapshot	At the time of selection, which consents were active.	Consent IDs and purposes.
5. Pooka contribution (future)	If a Pooka influenced the selection, what rationale did it provide?	Summarised reasoning (not raw personal data).

These logs must be accessible to the Werkle upon request (in a human‑readable form) within 48 hours. Logs must be stored in an immutable, tamper‑evident store with a retention of 1 year.

8. MINIMUM SAFE v1 + VERDICT
Minimum Safe v1 (current candidate only, no future Pooka/tailoring/sharing)

To ship a safe v1 of the current behaviour (/bellows/personal, /bellows/library/[slug], Proof Before Reliance), the following must be added:

Explicit consent flow – before using Recommendations to select lessons, present a clear notice and obtain opt‑in consent for that specific purpose.

Audit logging – log each selection event (anonymised Werkle ID, timestamp, selected lesson slugs, consent active).

Session‑only drafts – ensure Proof Before Reliance drafts are stored in sessionStorage (not localStorage) and cleared on tab close.

Rate‑limiting on public endpoints to prevent scraping.

Clear data‑classification labels in the UI (public vs. personal).

Verdict

GO for the current candidate (Personal Bellows lesson selection without Pooka) provided that the above 5 patches are applied.

REJECT the future capability (persistent Pooka, tailored lessons, artifact storage, progress, sharing) as currently described – it contains multiple P0/P1 design flaws (no consent boundaries, no deletion policy, no impersonation guardrails, no image rights, no bias audit). It must be redesigned with a separate threat model, privacy impact assessment, and explicit consent architecture before any development.

Final receipt – This review is controlled exclusively by the provided source bytes. No external APIs, tokens, monitoring, or inferred trust handshakes were used. Consent is not invented; all consent references above are requirements, not assumptions.

Action: Forward this report to foreman/handoffs/inbox/ and mark the future Pooka feature as REJECT until a revised proposal is submitted. Proceed with the patched v1 for the current candidate.
