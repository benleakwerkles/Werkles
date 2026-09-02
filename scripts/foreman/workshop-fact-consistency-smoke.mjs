import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "lib/owner-surfaces/owner-state.ts"),
  "utf8"
);
const pressureSource = fs.readFileSync(
  path.join(process.cwd(), "lib/owner-surfaces/workshop-pressure.ts"),
  "utf8"
);

for (const marker of [
  'describeWorkshopPressure(answers.time_cost)'
]) {
  if (!source.includes(marker)) {
    throw new Error(`Missing reviewed Workshop fact-consistency call site: ${marker}`);
  }
}

for (const marker of [
  '.split(";")',
  'Your intake does not name what is getting in the way yet.',
  'You named ${named[0]} as something getting in the way.',
  'You named multiple things getting in the way: ${readable}. We should not pick one as the main bottleneck yet.'
]) {
  if (!pressureSource.includes(marker)) {
    throw new Error(`Missing reviewed Workshop fact-consistency contract: ${marker}`);
  }
}

for (const forbidden of [
  "does not name a single obvious bottleneck",
  "as the main thing getting in the way",
  "Your answers point at more than one pressure",
  "Two pressures usually means"
]) {
  if (source.includes(forbidden) || pressureSource.includes(forbidden)) {
    throw new Error(`Contradictory Workshop pressure copy remains: ${forbidden}`);
  }
}

console.log("Workshop fact consistency contract: PASS");
