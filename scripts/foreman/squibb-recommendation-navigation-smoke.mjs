import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const surface = await readFile(
  path.join(root, "components/squibb/recommendation-surface.tsx"),
  "utf8"
);
const siteNav = await readFile(path.join(root, "lib/site-nav.ts"), "utf8");

assert.match(surface, /const hasRankedRecommendations = session\.ranked\.length > 0/);
assert.match(surface, /const initialView = requestedRanked \|\| \(!requestedCatalog && hasRankedRecommendations\) \? "ranked" : "catalog"/);
assert.match(surface, /activeList\.find\(\(r\) => r\.id === selectedId\) \?\? activeList\[0\]/);
assert.match(surface, /disabled=\{!hasRankedRecommendations\}/);
assert.match(surface, /if \(next === "ranked" && !hasRankedRecommendations\) return/);
assert.match(surface, /isRankedView \? "Here is a useful place to start\." : "Compare possible paths\."/);
assert.match(surface, /isRankedView \? "Why this came first" : "How this option could help"/);
assert.match(surface, /\{isRankedView \? \(/);
assert.match(surface, /id="recommendation-results" className="squibb-rec-surface__layout"/);
assert.match(siteNav, /nextHref: "#recommendation-results", nextLabel: "See My Results"/);
assert.doesNotMatch(siteNav, /path\.startsWith\("\/bellows\/recommendations"\)[^\n]+nextLabel: "My Work"/);
assert.doesNotMatch(
  surface,
  /activeList\.find[\s\S]*?\?\? session\.ranked\[0\][\s\S]*?\?\? session\.catalog\[0\]/,
  "detail selection must not borrow a card from a hidden deck"
);

console.log("Squibb recommendation deck navigation contract: PASS");
