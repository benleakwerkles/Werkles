import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const footer = read("components/foundry/public-trust-footer.tsx");
const onboarding = read("app/onboarding/page.tsx");
const globalCss = read("app/globals.css");

assert.match(footer, /export function PublicTrustFooter/);
assert.match(footer, /<footer className="site-footer">/);
assert.match(footer, /<Link href="\/privacy">Public Test Data Notice<\/Link>/);
assert.match(footer, /copy\.disclaimer/);
assert.match(footer, /showProofDisclaimer \? <p>\{copy\.proofDisclaimer\}<\/p> : null/);
assert.doesNotMatch(footer, /\/terms|Terms of|retention|deletion|sell|GDPR|CCPA|compliance guarantee/i);

const sharedFooterPages = [
  "app/page.tsx",
  "app/archetypes/page.tsx",
  "app/spark/page.tsx",
  "app/formation/page.tsx",
  "app/space/page.tsx",
  "app/proof/page.tsx",
  "app/bellows/page.tsx",
  "app/bellows/intake/page.tsx",
  "app/bellows/recommendations/page.tsx",
  "app/bellows/recommendations/test-case-0/page.tsx",
  "app/discovery/page.tsx",
  "app/login/page.tsx",
  "app/signup/page.tsx",
  "app/onboarding/page.tsx",
  "app/pricing/page.tsx",
  "app/membership/page.tsx",
  "app/membership/success/page.tsx"
];

for (const pagePath of sharedFooterPages) {
  const page = read(pagePath);
  assert.match(page, /PublicTrustFooter/, `${pagePath} must use the shared public trust footer`);
  assert.doesNotMatch(page, /<footer className="site-footer">/, `${pagePath} must not retain a copied footer`);
}

assert.match(onboarding, /"first-weld":\s*"This step sends the ZIP you enter to Zippopotam\.us/);
assert.match(onboarding, /"quick-weld": "This step saves the skills, goal, timeline, and work preference you enter to your signed-in profile\."/);
assert.match(onboarding, /blueprint: "This step saves your workshop narrative to your signed-in profile\."/);
assert.match(
  onboarding,
  /\{collectionNotice\} Read the <Link href="\/privacy">Public Test Data Notice<\/Link> before saving\./
);
assert.match(onboarding, /const collectionNotice = collectionNoticeByPhase\[phase\]/);

const noticeIndex = onboarding.indexOf('{collectionNotice ? (');
const firstCollectionIndex = onboarding.indexOf('phase === "first-weld" && (');
assert.ok(noticeIndex > -1 && noticeIndex < firstCollectionIndex, "notice must precede the active onboarding form");
assert.equal((onboarding.match(/className="profile-field-help onboarding-data-notice"/g) || []).length, 1);

assert.match(globalCss, /\.site-footer__trust-links\s*\{/);
assert.match(globalCss, /\.site-footer__trust-links a\s*\{/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "shared_footer_links_public_test_notice",
        "existing_disclaimer_copy_preserved",
        "proof_disclaimer_remains_optional",
        "public_auth_commerce_pages_use_shared_footer",
        "duplicated_footers_removed_from_owned_pages",
        "onboarding_notice_is_phase_accurate_and_precedes_collection",
        "notice_and_footer_make_no_new_policy_claims",
        "trust_link_has_visible_link_styling"
      ]
    },
    null,
    2
  )
);
