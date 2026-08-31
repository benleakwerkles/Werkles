#!/usr/bin/env node

import fs from "node:fs";

const intake = fs.readFileSync("app/bellows/intake/page.tsx", "utf8");
const login = fs.readFileSync("app/login/page.tsx", "utf8");
const evidence = fs.readFileSync("components/bellows/evidence-brief-builder.tsx", "utf8");
const intakeForm = fs.readFileSync("components/squibb/concierge-intake-form.tsx", "utf8");

const failures = [];
for (const [name, source, banned] of [
  ["Intake recovery", intake, ["Betsy walkthrough", "local Intake", "local walkthrough storage"]],
  ["Login return", login, ["local server", "local test-member work on Betsy"]],
  ["Evidence Brief", evidence, ["Next bounded check or Human Gate"]],
  ["Intake form", intakeForm, ["Saved on Betsy only"]]
]) {
  for (const phrase of banned) {
    if (source.includes(phrase)) failures.push(`${name} still contains internal phrase: ${phrase}`);
  }
}

for (const [name, source, required] of [
  ["Intake recovery", intake, ["Continue where you left off", "saved in this browser on this device, not to your Werkles account", "Continue with my last Intake"]],
  ["Login return", login, ["Account sign-in is not connected here yet", "practice member work saved in this browser"]],
  ["Evidence Brief", evidence, ["Next check or outside review"]],
  ["Intake form", intakeForm, ["Saved in this browser only", "until account saving is connected"]]
]) {
  for (const phrase of required) {
    if (!source.includes(phrase)) failures.push(`${name} is missing plain-language phrase: ${phrase}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PASS member copy: no Betsy/local-walkthrough/Human-Gate training-wheel language on Intake recovery, Login return, or Evidence Brief");
