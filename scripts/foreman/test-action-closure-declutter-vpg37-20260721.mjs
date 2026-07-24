import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

function executeTypeScript(source, modules = {}) {
  const output = ts.transpileModule(source, {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(
    (specifier) => modules[specifier] ?? {},
    loaded.exports,
    loaded
  );
  return loaded.exports;
}

const surface = read("components/squibb/recommendation-surface.tsx");
const css = read("app/bellows/recommendations/squibb-recommendations.css");
const routeSource = read("app/api/bellows/recommendations/packet/route.ts");

assert.doesNotMatch(surface, /RecommendationPacketState|packetState|setPacketState|SAVE_CLOSED_BETA/);
assert.doesNotMatch(surface, /Unavailable beta actions|Save this option|disabled=|aria-disabled=/);
assert.doesNotMatch(css, /squibb-rec-detail__buttons--closed|button:disabled|preview-note\[data-status=/);
assert.match(surface, /Saving is closed in this beta\. Nothing is sent\./);
assert.match(surface, /This private result was not saved or sent\./);
assert.match(surface, /aria-label="Private recommendation actions"[\s\S]*Update my profile/);
assert.match(surface, /aria-label="Available recommendation actions"[\s\S]*Check proof and gaps/);
assert.match(surface, /href=\{continuationAction\.href\}/);

const noteStart = surface.indexOf('id="squibbRecommendationSavingStatus"');
const noteEnd = surface.indexOf("</p>", noteStart);
const note = surface.slice(noteStart, noteEnd);
assert.ok(noteStart > -1 && noteEnd > noteStart);
assert.match(note, /role="note"/);
assert.doesNotMatch(note, /role="status"|aria-live|aria-atomic|data-status/);
assert.equal((surface.match(/id="squibbRecommendationSavingStatus"/g) || []).length, 1);
assert.equal((surface.match(/role="status"/g) || []).length, 1);

assert.doesNotMatch(routeSource, /request\.(?:json|text|formData)|insert|update|upsert|delete|writeFile|localStorage|sessionStorage/i);
let bodyReads = 0;
const route = executeTypeScript(routeSource, {
  "next/server": {
    NextResponse: {
      json(body, init) {
        return { body, status: init?.status ?? 200 };
      }
    }
  }
});
const forgedRequest = {
  json: async () => { bodyReads += 1; throw new Error("closed route must not read json"); },
  text: async () => { bodyReads += 1; throw new Error("closed route must not read text"); },
  formData: async () => { bodyReads += 1; throw new Error("closed route must not read form data"); }
};
const response = await route.POST(forgedRequest);
assert.equal(response.status, 403);
assert.deepEqual(response.body, {
  error: "Personal recommendation saving is unavailable while this beta is closed.",
  state: "Blocked"
});
assert.equal(bodyReads, 0);

console.log(JSON.stringify({
  pass: true,
  checks: [
    "dead_beta_controls_are_removed",
    "all_remaining_footer_controls_are_live",
    "public_and_private_closure_copy_is_concise",
    "impossible_packet_state_and_pseudo_flag_are_removed",
    "unreachable_closed_control_css_is_removed",
    "static_closure_uses_note_not_live_status",
    "card_selection_keeps_the_only_status_region",
    "packet_post_returns_exact_403_blocked",
    "forged_packet_body_is_never_read",
    "surface_and_route_add_no_write_primitive"
  ]
}, null, 2));
