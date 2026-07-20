import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const copy = read("lib/copy.ts");
const hero = read("components/foundry/hero-static.tsx");
const header = read("components/foundry/site-header.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const publicLoader = read("lib/squibb/public-recommendation-session-server.ts");
const css = read("app/bellows/recommendations/squibb-recommendations.css");

assert.match(copy, /primaryCta: "See the worked example"/);
assert.match(hero, /href="\/bellows\/recommendations"[\s\S]*\{copy\.hero\.primaryCta\}/);
assert.match(header, /href="\/bellows\/recommendations"[\s\S]*\{copy\.hero\.primaryCta\}/);
assert.match(publicLoader, /mode: "demo"/);

const exampleCustody = surface.slice(
  surface.indexOf("{isExample ? ("),
  surface.indexOf('<p className="eyebrow">{isPersonal ?')
);
assert.match(exampleCustody, /This is a walkthrough, not your result\./);
assert.doesNotMatch(exampleCustody, /href="\/bellows\/intake"/);
assert.doesNotMatch(exampleCustody, /Review the closed intake questions/);

const exampleCss = css.slice(
  css.indexOf(".squibb-rec-surface__example-custody {"),
  css.indexOf(".squibb-rec-surface__example-custody p")
);
assert.doesNotMatch(exampleCss, /grid-template-columns/);

const surfaceIndex = delivery.indexOf("<SquibbRecommendationSurface");
const accountDoorwayIndex = delivery.lastIndexOf('delivery.status === "signed_out" ? (');
assert.ok(surfaceIndex > -1 && accountDoorwayIndex > surfaceIndex);
assert.match(delivery.slice(accountDoorwayIndex), /href="\/signup\?next=%2Fbellows%2Frecommendations"/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "shared_cta_names_the_worked_example",
        "hero_and_header_preserve_the_example_route",
        "public_loader_remains_demo_only",
        "example_custody_keeps_truthful_notice",
        "example_custody_has_no_closed_intake_detour",
        "example_custody_is_single_column",
        "complete_example_precedes_account_doorway",
        "account_doorway_preserves_sanitized_return"
      ]
    },
    null,
    2
  )
);
