import fs from "node:fs";

const hero = fs.readFileSync("lib/hero-copy-variants.ts", "utf8");
const copy = fs.readFileSync("lib/copy.ts", "utf8");

function requireText(source, text, label) {
  if (!source.includes(text)) throw new Error(`Missing ${label}: ${text}`);
}

requireText(hero, "Figure out your next step. Build something real.", "ordinary-person headline");
requireText(hero, "starting an idea, growing a business, solving a problem", "broad invitation");
requireText(copy, "When evidence exists, Werkles shows it", "evidence boundary");
requireText(copy, "When something is uncertain, it stays uncertain", "uncertainty boundary");

const primaryBlock = hero.slice(hero.indexOf("HERO_HEADLINE_PRIMARY"), hero.indexOf("HERO_HEADLINE_VARIANTS"));
for (const gatekeeper of ["entrepreneur", "founder", "operator", "builder", "startup", "investor", "proof"]) {
  if (primaryBlock.toLowerCase().includes(gatekeeper)) {
    throw new Error(`Primary homepage promise still requires insider identity: ${gatekeeper}`);
  }
}

console.log("Homepage democratic promise smoke: PASS");
