# V — Match Deck conversation provenance and member influence

Date: 2026-08-21
Foreman: Heimerdinker@Betsy
Lane: Werkles.com / matching / Match Deck
Environment: local only, existing dirty shared worktree

## Operator finding

`Prepare for a Real Conversation` is nearly useful, but it does not explain what the member did to generate the four questions and answers, what controls those prompts, or what another person would see about the member.

## Fixed baseline

- Intake and deliberate profile choices determine which candidates appear and their order.
- The four displayed questions are currently generated deterministically from the selected candidate's first stated offer, first stated need, lane, and name.
- The synthetic candidate answers are generated from the candidate's same offer/need/lane plus a deterministic voice variant.
- Asking/clicking a practice question does not retrain matching, save a member preference, contact anyone, or change what another member sees.
- `Prepare for a Real Conversation` carries only the selected synthetic candidate's bounded offer/need/reason/caution context into a private Bellows alignment memo. It does not carry the transcript or populate answers.
- Current UI does not explain these facts clearly enough.

## Bounded outcome

Make the source of each prompt understandable, show what the member controls, and distinguish current synthetic practice from future member-to-member behavior without inventing account persistence or a live introduction.

## Required duties

### Ender — pre-code UX challenger

- Decide the smallest human explanation that answers: `Why these four?`, `What can I change?`, and `What would someone else see about me?`
- Attack quiz/test feeling and internal terminology.

### Bean — trust challenger

- Verify that prompt provenance does not imply hidden behavioral tracking, real contact, or saved answers.
- Require explicit boundaries for self-reported member data and synthetic answers.

### Lady Jessica / Doozer — post-code Handeye

- Walk the exact Match Deck candidate, ask questions, open preparation, and verify that visible provenance matches actual behavior.

## Candidate implementation rules

1. Keep four candidate-specific prompts, but display the source beside each prompt in ordinary language.
2. Add one short `What you control` explanation: Intake/profile facts affect candidate selection; editing those facts changes the deck.
3. Add one short `What others would see` explanation: future real-member prompts would be built from the offers, needs, working preference, and project facts the member deliberately chooses to share—not clicks, dwell time, balance, or hidden inference.
4. Carry asked prompt/answer pairs into the private preparation memo as questions already explored, without treating synthetic answers as truth or filling the member's answers.
5. Do not claim account save, real-member contact, live profile publishing, or learning from clicks.

## Acceptance

- A member can explain why all four prompts appeared without reading source code.
- Candidate choice changes candidate-specific prompt content.
- The private preparation page remembers which synthetic practice exchanges were explored and labels them unverified practice.
- No prompt click changes match order or creates a server/account write.
- Focused contracts, TypeScript, rendered local interaction, mobile containment, and console check pass.

## Hard edges

No new subagents/environments, real member contact, profile publication, account/schema/provider work, secrets, payments, push, deploy, or production mutation.
