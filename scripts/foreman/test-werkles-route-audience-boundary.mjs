import fs from "node:fs/promises";
import path from "node:path";

import {
  isInternalApiPath,
  isInternalRoutePath,
  isLocalDevelopmentHost,
  shouldDenyInternalRoute
} from "../../lib/route-audience.ts";

const cases = [
  ["operator production", { pathname: "/operator", hostname: "werkles.com", nodeEnv: "production" }, true],
  [
    "nested operator production",
    { pathname: "/operator/matching/shadow", hostname: "werkles.com", nodeEnv: "production" },
    true
  ],
  ["thinkit preview no bypass", { pathname: "/thinkit", hostname: "werkles-git-test-werkles.vercel.app", nodeEnv: "production", vercelEnv: "preview" }, true],
  [
    "operator preview bypass but flag missing",
    {
      pathname: "/operator/matching/shadow",
      hostname: "werkles1-test-werkles.vercel.app",
      nodeEnv: "production",
      vercelEnv: "preview",
      hasVercelProtectionBypass: true
    },
    true
  ],
  [
    "operator preview flag but bypass missing",
    {
      pathname: "/operator/matching/shadow",
      hostname: "werkles1-test-werkles.vercel.app",
      nodeEnv: "production",
      vercelEnv: "preview",
      internalPreviewAccess: "enabled"
    },
    true
  ],
  [
    "operator preview bypass allowed",
    {
      pathname: "/operator/matching/shadow",
      hostname: "werkles1-test-werkles.vercel.app",
      nodeEnv: "production",
      vercelEnv: "preview",
      internalPreviewAccess: "enabled",
      hasVercelProtectionBypass: true
    },
    false
  ],
  [
    "operator production bypass still denied",
    {
      pathname: "/operator/matching/shadow",
      hostname: "werkles.com",
      nodeEnv: "production",
      vercelEnv: "production",
      internalPreviewAccess: "enabled",
      hasVercelProtectionBypass: true
    },
    true
  ],
  ["tinkerden query path", { pathname: "/tinkerden/receipts", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["soledash production", { pathname: "/soledash", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["gd production", { pathname: "/gd/command-console", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["nerdkle production", { pathname: "/nerdkle", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["operator localhost dev", { pathname: "/operator", hostname: "localhost", nodeEnv: "development" }, false],
  ["operator ipv4 dev", { pathname: "/operator/matching/shadow", hostname: "127.0.0.1", nodeEnv: "development" }, false],
  ["operator ipv6 dev", { pathname: "/operator", hostname: "[::1]", nodeEnv: "development" }, false],
  ["operator localhost production", { pathname: "/operator", hostname: "localhost", nodeEnv: "production" }, true],
  ["public root", { pathname: "/", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["public bellows", { pathname: "/bellows", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["prefix confusion", { pathname: "/operator-handbook", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["nested word confusion", { pathname: "/proof/operator", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["soledash api GET production", { pathname: "/api/soledash/v1/state", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["tinkerden api POST production", { pathname: "/api/tinkerden/bridge/execute", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["thinkit api production", { pathname: "/api/thinkit/elwood/status", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["nerdkle api production", { pathname: "/api/nerdkle/actions", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["organism api production", { pathname: "/api/organism/contracts/packets", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["speaker api production", { pathname: "/api/speaker/inheritance", hostname: "werkles.com", nodeEnv: "production" }, true],
  ["internal api localhost dev", { pathname: "/api/tinkerden/receipts", hostname: "localhost", nodeEnv: "development" }, false],
  ["bellows api stays public", { pathname: "/api/bellows/intake", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["discovery api stays public", { pathname: "/api/discovery/intake", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["membership api stays public", { pathname: "/api/membership/checkout", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["verification api stays public", { pathname: "/api/verification/identity", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["auth api stays public", { pathname: "/api/auth-first/logout", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["stripe webhook stays public", { pathname: "/api/webhooks/stripe", hostname: "werkles.com", nodeEnv: "production" }, false],
  ["api prefix confusion", { pathname: "/api/soledashboard", hostname: "werkles.com", nodeEnv: "production" }, false]
];

const results = cases.map(([name, input, expectedDeny]) => {
  const actualDeny = shouldDenyInternalRoute(input);
  return { name, ...input, expectedDeny, actualDeny, pass: actualDeny === expectedDeny };
});

const unitChecks = [
  { name: "trailing slash internal", pass: isInternalRoutePath("/operator/") },
  { name: "similar prefix public", pass: !isInternalRoutePath("/operators") },
  { name: "localhost recognized", pass: isLocalDevelopmentHost("LOCALHOST") },
  { name: "public host not local", pass: !isLocalDevelopmentHost("werkles.com") },
  { name: "nested internal api", pass: isInternalApiPath("/api/organism/contracts/receipts") },
  { name: "similar api prefix public", pass: !isInternalApiPath("/api/speakerphone") }
];

const receipt = {
  schema: "werkles_internal_external_route_boundary_v1",
  created_at: new Date().toISOString(),
  policy: "deny internal page and API families outside local development except explicit Vercel Preview automation-bypass access with WERKLES_INTERNAL_PREVIEW_ACCESS=enabled; no cookie or query bypass",
  pass: [...results, ...unitChecks].every((result) => result.pass),
  results,
  unit_checks: unitChecks,
  boundary_note: "This proves deny-by-default page and API concealment, not authenticated operator access."
};

const output = path.resolve("foreman/receipts/WERKLES_INTERNAL_EXTERNAL_ROUTE_BOUNDARY_20260712.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

console.log(`INTERNAL_EXTERNAL_BOUNDARY=${receipt.pass ? "PASS" : "FAIL"}`);
for (const result of [...results, ...unitChecks]) console.log(`${result.pass ? "PASS" : "FAIL"} ${result.name}`);
console.log(`RECEIPT=${output}`);
process.exitCode = receipt.pass ? 0 : 1;
