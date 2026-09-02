# V — Personal Bellows working path

Date: 2026-08-20  
Seat: Heimerdinker / Codex Foreman  
Lane: local Werkles Bellows and matching walkthrough  
Environment: Betsy localhost only

## Vision

Personal Bellows should not be three links selected from a public catalog. It
should turn the member's current recommendation reasoning into a short working
path that teaches a method and produces something useful.

For each distinct lesson selected from the current ranked recommendations,
show:

1. why the method matters now, expressed as Werkles reasoning rather than a
   verbatim replay of the Intake;
2. one bounded exercise;
3. the concrete output the member should leave with;
4. the finish line that tells the member when the exercise is useful enough;
5. the related complete lesson in the Public Bellows library.

## Pulled actual-CBCC judgment

- Bean: Personal Bellows may select public lessons from current personal
  reasoning, but private state must not flow into the public library or into a
  persistent Pooka. The UI must distinguish personal selection from public
  content and explain why a lesson appeared.
- Petra: a Bellows lesson fails if it merely advises skepticism or another
  obvious action. It must leave the member with a reusable work product and
  keep unknowns visible.
- Ender: plain language comes before workshop mythology. The member should not
  have to learn insider vocabulary before receiving value.

## G ideas

1. Add a pure, deterministic Personal Bellows path composer over the existing
   recommendation-plan engine. It must reject demo/example sessions and
   de-duplicate public lessons.
2. Rebuild `/bellows/personal` around practical working cards: Werkles read,
   20-minute exercise, output, finish line, and public lesson.
3. Add focused source/runtime proof for no verbatim intake rendering, no demo
   fallback, unique lesson selection, and useful-output requirements.

## Hard edges

- No LLM or Pooka claim.
- No new provider, network, secret, schema, RLS, production-data, account-share,
  push, deploy, or spend action.
- No personal answer is copied into the rendered path.
- No permanent curriculum, progress, or cross-member sharing claim.
- Public lesson pages receive no personal data.
- Current session/account custody boundaries remain honestly stated.

## Stop condition

Stop this beat after the pure path contract, Personal Bellows integration,
focused tests, typecheck, and local rendered verification are green, or at the
first true human gate.
