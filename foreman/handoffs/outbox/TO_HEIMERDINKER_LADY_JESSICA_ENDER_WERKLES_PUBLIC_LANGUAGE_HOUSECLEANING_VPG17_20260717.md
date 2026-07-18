# Flock Packet — Public Language Housecleaning VPG17

Status: `OPEN`
Machine: `Betsy`
Execution/push owner: Heimerdinker / Dink@Betsy
Review seats: Lady Jessica / Cursor@Betsy and Ender@Betsy
Repository: `benleakwerkles/Werkles`
Starting source: `234f25f71efbeb6e1945729ea938573b3c13dad8`

## Mission

Make Bellows and Discovery feel like welcoming Werkles pages rather than implementation reviews by removing public-facing build vocabulary and reducing choice clutter.

## VPG PREPARE — read-only pull

Inspect the public Bellows and Discovery routes, their existing imagery, actions, captions, intake boundary, and shared copy. Return exactly two strong, bounded changes that make both routes warmer and easier to understand without opening submission or changing recommendation behavior.

Heimerdinker owns all edits, verification, commits, pushes, localhost hands, and any future Preview hands.

## VPG GO boundary

- Remove public references to route shells, draft/canonical review, file paths, Speaker packets, Layer 0, internal state models, and other implementation vocabulary.
- Keep Squibb imagery and useful narrative photography; rewrite captions rather than removing helpful pictures.
- Reduce competing first-screen choices through existing actions; do not add navigation, panels, routes, or a new content system.
- Keep Discovery submission fail-closed and explicitly state that nothing typed is saved or sent.
- Preserve the distinction between examples, human review, recommendations, proof, and live behavior.
- No browser/cursor control, manual deploy, Production action, PR, SQL/schema/RLS, persistence, LLM enablement, provider call, member-data read, or external delivery. The approved isolated branch push may create the repository's configured protected Git Preview; do not promote or alias it.

## Acceptance

- Bellows contains no public internal-review or code-path language and presents a clear two-action starting point.
- Discovery contains no `Layer 0` or internal state-machine strip.
- Discovery still says the form is closed and nothing typed is saved or sent.
- Existing imagery, route structure, and responsive behavior remain intact.
