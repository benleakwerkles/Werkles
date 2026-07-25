#!/usr/bin/env node

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(repoRoot, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const fixturePath =
  "scripts/foreman/fixtures/vpg46-matching-generation-gate-contract-20260724.json";
const fixture = JSON.parse(read(fixturePath));

function loadTs(source, localRequire = (specifier) => require(specifier)) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

const generationContract = fixture.generation;
const recommendationTypes = loadTs(read("lib/squibb/recommendations.ts"));
const gateBuilder = loadTs(read("lib/matching/public-recommendation-gates.ts"));
const disclosure = loadTs(read("lib/matching/personal-recommendation-disclosure.ts"));
const shadowMapper = loadTs(
  read("lib/matching/shadow-to-recommendations.ts"),
  (specifier) => {
    if (specifier === "@/lib/matching/public-recommendation-gates") return gateBuilder;
    if (specifier === "@/lib/squibb/recommendations") return recommendationTypes;
    return require(specifier);
  }
);
const contract = loadTs(
  read("lib/matching/personal-recommendation-contract.ts"),
  (specifier) => {
    if (specifier === "@/lib/squibb/recommendations") return recommendationTypes;
    if (specifier === "@/lib/matching/personal-recommendation-disclosure") {
      return disclosure;
    }
    if (specifier === "@/lib/matching/public-recommendation-gates") return gateBuilder;
    return require(specifier);
  }
);
const expectedGeneration = disclosure.PERSONAL_RECOMMENDATION_GENERATION;
const syntheticRun = {
  source: "member_profile",
  createdAt: "1970-01-01T00:00:00.000Z",
  intakeId: "private-profile",
  signals: { statedNeed: "Find a practical next step" },
  readout: {
    primaryBottleneck: "Review this possible next step and its limits before acting.",
    recommendationCard: {
      whatYouAskedFor: "Find a practical next step",
      whatWeHeardUnderneath: "A reversible next step may help.",
      visibleReasons: ["Your saved profile supplied the current inputs."]
    },
    scoredPaths: [
      {
        kind: "translate_need",
        rank: 1,
        score: 71,
        confidenceLabel: "medium",
        rationale: ["Confirm the interpretation before acting."],
        evidenceStrength: "self_reported"
      }
    ],
    facts: [
      {
        id: "stated-need",
        value: "Find a practical next step",
        strength: "self_reported"
      }
    ]
  }
};
const calls = [];

const profileBuilder = loadTs(
  read("lib/matching/profile-recommendation.ts"),
  (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier === "@/lib/matching/personal-recommendation-disclosure") {
      return disclosure;
    }
    if (specifier === "@/lib/matching/signals") {
      return {
        signalsFromMemberProfile(profile) {
          calls.push("signalsFromMemberProfile");
          return profile?.usable === false
            ? null
            : {
                intakeId: "private-profile",
                source: "member_profile",
                statedNeed: "Find a practical next step"
              };
        }
      };
    }
    if (specifier === "@/lib/matching/layer0") {
      return {
        runLayer0(signals) {
          calls.push("runLayer0");
          return { signals };
        }
      };
    }
    if (specifier === "@/lib/matching/not-match") {
      return {
        evaluateNotMatch(signals, layer0) {
          calls.push("evaluateNotMatch");
          return { signals, layer0 };
        }
      };
    }
    if (specifier === "@/lib/matching/score-paths") {
      return {
        scorePaths(signals, layer0, notMatch) {
          calls.push("scorePaths");
          return [{ signals, layer0, notMatch }];
        }
      };
    }
    if (specifier === "@/lib/matching/deliver") {
      return {
        buildMatchingReadout(signals, layer0, notMatch, scoredPaths) {
          calls.push("buildMatchingReadout");
          return { signals, layer0, notMatch, scoredPaths };
        },
        buildSquibbVoice(readout) {
          calls.push("buildSquibbVoice");
          return { readout };
        }
      };
    }
    if (specifier === "@/lib/matching/shadow-to-recommendations") {
      return {
        shadowRunToRecommendationSession(run) {
          calls.push("shadowRunToRecommendationSession");
          return shadowMapper.shadowRunToRecommendationSession({
            ...syntheticRun,
            source: run.source,
            signals: { statedNeed: run.signals.statedNeed }
          });
        }
      };
    }
    return require(specifier);
  }
);

const failures = [];
const checks = [];
function check(name, condition, detail = null) {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) failures.push({ name, detail });
}

const generated = profileBuilder.recommendationSessionFromMemberProfile({
  usable: true,
  primary_goal: "Find a practical next step"
});
const usableCalls = [...calls];
calls.length = 0;
const insufficient = profileBuilder.recommendationSessionFromMemberProfile({ usable: false });
const insufficientCalls = [...calls];

check("usable_profile_returns_session", Boolean(generated));
check(
  "deterministic_pipeline_order",
  JSON.stringify(usableCalls) ===
    JSON.stringify([
      "signalsFromMemberProfile",
      "runLayer0",
      "evaluateNotMatch",
      "scorePaths",
      "buildMatchingReadout",
      "buildSquibbVoice",
      "shadowRunToRecommendationSession"
    ]),
  usableCalls
);
check("insufficient_profile_returns_null", insufficient === null);
check(
  "insufficient_profile_stops_before_rules",
  JSON.stringify(insufficientCalls) === JSON.stringify(["signalsFromMemberProfile"]),
  insufficientCalls
);

for (const [field, expected] of Object.entries(expectedGeneration)) {
  if (field === "explanation") continue;
  check(`generation_${field}`, generated?.generation?.[field] === expected, {
    expected,
    actual: generated?.generation?.[field]
  });
}

const explanation = generated?.generation?.explanation;
check(
  "generation_explanation_bounded",
  typeof explanation === "string" &&
    explanation.trim().length > 0 &&
    explanation.length <= generationContract.explanation_max_length,
  explanation ?? null
);
for (const [index, alternatives] of generationContract.explanation_phrase_groups.entries()) {
  const lower = String(explanation ?? "").toLowerCase();
  check(
    `generation_explanation_phrase_group_${index + 1}`,
    alternatives.some((phrase) => lower.includes(phrase)),
    alternatives
  );
}

check("authenticated_profile_source", generated?.source?.mode === "authenticated_profile");
check("source_has_no_raw_intake_id", generated?.source?.intakeId === undefined);
check("source_has_no_packet_path", generated?.source?.packetPath === undefined);
check("source_has_no_speaker_path", generated?.source?.speakerEntryPath === undefined);

const profileSource = read("lib/matching/profile-recommendation.ts");
const routeSource = read("app/api/bellows/recommendations/personal/route.ts");
const surfaceSource = read("components/squibb/recommendation-surface.tsx");
for (const step of [
  "signalsFromMemberProfile",
  "runLayer0",
  "evaluateNotMatch",
  "scorePaths",
  "buildMatchingReadout",
  "shadowRunToRecommendationSession"
]) {
  check(`source_call_${step}`, profileSource.includes(`${step}(`));
}
check("source_declares_llm_false", /llmUsed:\s*false/.test(profileSource));
check(
  "disclosure_declares_ai_and_provider_false",
  /aiModelUsed:\s*false/.test(read("lib/matching/personal-recommendation-disclosure.ts")) &&
    /providerContacted:\s*false/.test(
      read("lib/matching/personal-recommendation-disclosure.ts")
    )
);
check(
  "source_has_no_external_side_effect_call",
  !/(?:fetch|writeFile|appendFile|persistShadowRun|insert|update|upsert|delete)\s*\(/.test(
    profileSource
  )
);
check("route_uses_authenticated_owner", /\.eq\("id", auth\.user\.id\)/.test(routeSource));
check("route_does_not_read_caller_owner", !/request\.(?:json|text|formData|body)/.test(routeSource));
check("route_does_not_mutate", !/\.(?:insert|update|upsert|delete)\s*\(/.test(routeSource));
check(
  "surface_renders_structured_explanation",
  /(?:session\.generation|personalGeneration)\??\.explanation/.test(surfaceSource)
);

const validSession = structuredClone(generated);
const validResponse = {
  success: true,
  persisted: false,
  status: "personal",
  session: validSession
};
check(
  "valid_structured_generation_classifies_personal",
  contract.isPersonalRecommendationResponse(validResponse)
);

const mutations = [
  {
    name: "method",
    mutate(response) {
      response.session.generation.method = "ai_generated";
    }
  },
  {
    name: "input",
    mutate(response) {
      response.session.generation.input = "provider_data";
    }
  },
  {
    name: "execution",
    mutate(response) {
      response.session.generation.execution = "external_service";
    }
  },
  ...generationContract.false_fields.map((field) => ({
    name: field,
    mutate(response) {
      response.session.generation[field] = true;
    }
  })),
  {
    name: "empty_explanation",
    mutate(response) {
      response.session.generation.explanation = "";
    }
  },
  {
    name: "oversized_explanation",
    mutate(response) {
      response.session.generation.explanation = "x".repeat(
        generationContract.explanation_max_length + 1
      );
    }
  },
  {
    name: "missing_no_action_truth",
    mutate(response) {
      response.session.generation.explanation =
        "Fixed written rules ranked your saved profile in memory. No AI model, provider, person, intro, contact, or payment was triggered.";
    }
  }
];

const mutationResults = mutations.map(({ name, mutate }) => {
  const response = structuredClone(validResponse);
  mutate(response);
  const accepted = contract.isPersonalRecommendationResponse(response);
  check(`generation_mutation_rejected_${name}`, !accepted);
  return { name, expected: "reject", accepted };
});

const result = {
  schema: "werkles.vpg46-ender-matching-generation-source-truth/v1",
  cycle_id: fixture.cycle_id,
  legacy_label: fixture.legacy_label,
  fixture: fixturePath,
  idea: "DETERMINISTIC_GENERATION_SOURCE_TRUTH",
  check_count: checks.length,
  failure_count: failures.length,
  mutation_count: mutationResults.length,
  mutation_bypasses: mutationResults.filter((entry) => entry.accepted).map((entry) => entry.name),
  failures,
  result: failures.length === 0 ? "PASS" : "FAIL"
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 2;
