# To Doozer / Orson — exact Workshop fact candidate review

Date: 2026-08-17  
From: Heimerdinker@Betsy  
Review type: personal, post-mutation, source-bounded  
No subagents, edits, new tasks/environments, providers, secrets, SQL, push, or deploy.

## Candidate claim

The Workshop working-read sentence must report the member's structured `time_cost` answer without contradicting it or inventing a primary bottleneck.

## Exact production mutation

Path: `lib/owner-surfaces/owner-state.ts`

```ts
function describePressure(blockerAnswer: string): string {
  const named = blockerAnswer
    .split(";")
    .map((blocker) => blocker.trim())
    .filter(Boolean);

  if (named.length === 0) {
    return "Your intake does not name what is getting in the way yet.";
  }
  if (named.length === 1) {
    return `You named ${named[0]} as the main thing getting in the way.`;
  }

  const readable = `${named.slice(0, -1).join(", ")}, and ${named.at(-1)}`;
  return `You named multiple things getting in the way: ${readable}. We should not pick one as the main bottleneck yet.`;
}
```

Exact call site in `loadOwnerSurfaceState`:

```ts
pressure: describePressure(answers.time_cost),
```

`answers.time_cost` is reconstructed from the latest stored Intake packet by exact question ID. The current structured Intake UI serializes selected blocker labels as a semicolon-delimited string. This slice does not change that storage contract.

## Exact focused contract

Path: `scripts/foreman/workshop-fact-consistency-smoke.mjs`

```js
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "lib/owner-surfaces/owner-state.ts"),
  "utf8"
);

for (const marker of [
  'describePressure(answers.time_cost)',
  '.split(";")',
  'Your intake does not name what is getting in the way yet.',
  'You named ${named[0]} as the main thing getting in the way.',
  'You named multiple things getting in the way: ${readable}. We should not pick one as the main bottleneck yet.'
]) {
  if (!source.includes(marker)) {
    throw new Error(`Missing reviewed Workshop fact-consistency contract: ${marker}`);
  }
}

for (const forbidden of [
  "does not name a single obvious bottleneck",
  "Your answers point at more than one pressure",
  "Two pressures usually means"
]) {
  if (source.includes(forbidden)) {
    throw new Error(`Contradictory Workshop pressure copy remains: ${forbidden}`);
  }
}

console.log("Workshop fact consistency contract: PASS");
```

## Builder proof

- zero selections renders that none was named;
- one selection names that selection;
- supplied two-selection case renders `Customers or sales, and Tools, equipment, or space` and refuses to choose one as primary;
- focused contract PASS;
- TypeScript PASS;
- rendered browser proof PASS.

## Hostile questions

1. Does this sentence ever contradict zero, one, or multiple structured selections?
2. Does it invent a diagnosis, score, or primary bottleneck?
3. Does punctuation or the delimiter permit a misleading claim within the stated existing storage contract?
4. Is the focused contract materially adequate for this narrow mutation, and what bounded residual debt remains?

## Required return

State `PERSONAL_REVIEW`, `NO_SUBAGENTS`, execution context, `PASS` or `BLOCKER`, exact defects, checks performed, and residual bounded debt. Do not infer or review unrelated portions of the unrelayed file.
