#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTs(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("exports", "module", output)(loaded.exports, loaded);
  return loaded.exports;
}

const optionsSource = read("lib/profile-builder-options.ts");
const profileSource = read("app/dashboard/profile/page.tsx");
const options = loadTs(optionsSource);
const checks = [];

function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
}

check("state_catalog_has_56_states_dc_and_territories", options.US_STATE_OPTIONS.length === 56);
check("state_code_is_case_normalized", options.normalizeUsStateCode("ga") === "GA");
check("legacy_full_state_name_is_normalized", options.normalizeUsStateCode("Georgia") === "GA");
check("unknown_state_requires_review", options.normalizeUsStateCode("Atlantis") === "");
check("lane_vocabulary_remains_closed", options.isProfileLaneValue("Builder"));
check("unknown_lane_is_not_silently_accepted", !options.isProfileLaneValue("Wizard"));
check("visibility_vocabulary_remains_closed", options.isProfileVisibilityValue("first_name_only"));
check("raw_visibility_key_is_not_user_copy", !profileSource.includes(">first_name_only<"));
check(
  "account_and_preferred_email_remain_distinct",
  /<span>Account email<\/span>[\s\S]*readOnly[\s\S]*Preferred contact email \(optional\)/.test(
    profileSource
  )
);
check(
  "legacy_state_is_normalized_on_hydration_and_submit",
  /normalizeUsStateCode\(data\.location_state\)/.test(profileSource) &&
    /location_state: normalizeUsStateCode\(form\.get\("location_state"\)\)/.test(profileSource)
);
check(
  "unknown_lane_and_visibility_force_explicit_review",
  /saved value needs review/.test(profileSource) &&
    /name="lane"[\s\S]*required/.test(profileSource) &&
    /name="visibility_mode"[\s\S]*required/.test(profileSource)
);
check(
  "double_submit_is_closed_while_save_is_pending",
  /if \(isSaving\) return;/.test(profileSource) &&
    /setIsSaving\(true\)/.test(profileSource) &&
    /finally \{[\s\S]*setIsSaving\(false\)/.test(profileSource) &&
    /aria-busy=\{isSaving\}/.test(profileSource) &&
    (profileSource.match(/type="submit" disabled=\{isSaving\}/g)?.length ?? 0) === 3
);
check(
  "form_element_survives_async_auth_boundary",
  /const formElement = event\.currentTarget;[\s\S]*await supabase\.auth\.getUser\(\)[\s\S]*new FormData\(formElement\)/.test(
    profileSource
  )
);
check(
  "primary_goal_stays_suggested_and_custom_fillable",
  /list="primaryGoalSuggestions"/.test(profileSource) &&
    /Pick a suggestion or write a goal in your own words\./.test(profileSource)
);

console.log(
  JSON.stringify(
    {
      cycle_id: "WERKLES-FLOCK-20260724-224709-ET-BETSY-01",
      legacy_label: "VPG46",
      pass: true,
      check_count: checks.length,
      checks
    },
    null,
    2
  )
);
