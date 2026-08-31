import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const formation = read("components/werkle/formation-workbench.tsx");
const formationStyles = read("app/dashboard/werkles/formation/werkle-formation.css");
const interaction = read("lib/ghost-fleet/interaction.ts");

const checks = [
  [formation.includes("function sourcePreview") && formation.includes("Read your full source wording") && formation.includes("Read their full source wording"), "Formation summarizes source text before offering the exact wording"],
  [formation.includes("activeDefinition.ownerSource.text") && formation.includes("activeDefinition.partnerSource.text"), "Formation preserves both complete source records"],
  [formation.includes("Work on next:") && formation.includes('id="formation-studio"') && formation.includes("setActiveTopicId(nextOpenDefinition.id)"), "Formation names and opens the next unresolved decision"],
  [formationStyles.includes(".werkle-merge-canvas__full-source") && formationStyles.includes(".werkle-dashboard__next"), "Formation distinguishes provenance disclosure from the next-work action"],
  [interaction.includes("The part I know best is ${offer}.") && interaction.includes("one real problem in that lane"), "Match replies turn a claimed skill into a concrete conversation"],
  [!interaction.includes("My best contribution is ${offer}"), "Match replies do not parrot the profile field as a robotic sentence"],
];

const failed = checks.filter(([pass]) => !pass);
if (failed.length) {
  for (const [, label] of failed) console.error(`FAIL ${label}`);
  process.exit(1);
}

console.log(`PASS BVPGM M10 match-to-Werkle continuity: ${checks.length}/${checks.length}`);
