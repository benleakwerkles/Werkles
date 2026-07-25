#!/usr/bin/env node

import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const origin = argument("--origin");
const output = argument("--output");
if (!origin) throw new Error("--origin is required");

function digest(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function probe(testCase) {
  const started = performance.now();
  try {
    const response = await fetch(`${origin}${testCase.pathname}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000)
    });
    const body = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "";
    const text = /(?:text|json|html|xml)/i.test(contentType) ? body.toString("utf8") : "";
    const leakedPath = /[A-Z]:\\(?:Users|w8)\\/i.test(text)
      || /node_modules[\\/]+next[\\/]+dist/i.test(text);
    const statusPass = testCase.kind === "valid"
      ? response.status === 200
      : response.status >= 400 && response.status < 500;
    const typePass = testCase.kind === "valid"
      ? /^image\//i.test(contentType)
      : !/^image\//i.test(contentType);
    return {
      name: testCase.name,
      kind: testCase.kind,
      status: response.status,
      duration_ms: Math.round(performance.now() - started),
      bytes: body.length,
      content_type: contentType,
      cache_control: response.headers.get("cache-control"),
      x_nextjs_cache: response.headers.get("x-nextjs-cache"),
      x_content_type_options: response.headers.get("x-content-type-options"),
      body_sha256: digest(body),
      pass: statusPass && typePass && !leakedPath && body.length <= 5 * 1024 * 1024,
      leaked_path: leakedPath
    };
  } catch (error) {
    return {
      name: testCase.name,
      kind: testCase.kind,
      error: error.message,
      pass: false
    };
  }
}

function imagePath(url, width = "640", quality = "75") {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${encodeURIComponent(width)}&q=${encodeURIComponent(quality)}`;
}

const cases = [
  {
    name: "valid-large-png",
    kind: "valid",
    pathname: imagePath("/assets/werkles-hero-foundry-bubbles.png")
  },
  {
    name: "valid-large-jpeg",
    kind: "valid",
    pathname: imagePath("/assets/draft/anyone-narrative-stock/stock-hero-workshop.jpg")
  },
  {
    name: "valid-squibb-png",
    kind: "valid",
    pathname: imagePath("/assets/draft/squibb-bellows-v1/werkles-squibb-bellows-lesson-card-v1.png")
  },
  { name: "missing-all-parameters", kind: "abuse", pathname: "/_next/image" },
  { name: "missing-url", kind: "abuse", pathname: "/_next/image?w=640&q=75" },
  { name: "missing-width", kind: "abuse", pathname: "/_next/image?url=%2Fprivacy&q=75" },
  { name: "missing-quality", kind: "abuse", pathname: "/_next/image?url=%2Fprivacy&w=640" },
  { name: "non-image-page", kind: "abuse", pathname: imagePath("/privacy") },
  { name: "nonexistent-local", kind: "abuse", pathname: imagePath("/assets/does-not-exist.png") },
  { name: "encoded-traversal", kind: "abuse", pathname: imagePath("/../.env.example") },
  {
    name: "encoded-traversal-deep",
    kind: "abuse",
    pathname: imagePath("/assets/%2e%2e/%2e%2e/.env.example")
  },
  {
    name: "internal-api-target",
    kind: "abuse",
    pathname: imagePath("/api/bellows/recommendations/personal")
  },
  { name: "disallowed-external-host", kind: "abuse", pathname: imagePath("https://example.com/a.png") },
  { name: "protocol-relative-host", kind: "abuse", pathname: imagePath("//example.com/a.png") },
  { name: "file-scheme", kind: "abuse", pathname: imagePath("file:///C:/Windows/win.ini") },
  { name: "data-scheme", kind: "abuse", pathname: imagePath("data:image/png;base64,AA==") },
  {
    name: "svg-default-deny",
    kind: "abuse",
    pathname: imagePath("/assets/draft/icon-exploration-v1/favicon-candidates/five-piece-favicon-mono.svg")
  },
  { name: "zero-width", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "0") },
  { name: "negative-width", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "-1") },
  { name: "oversized-width", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "99999") },
  { name: "non-numeric-width", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "wide") },
  { name: "zero-quality", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "640", "0") },
  { name: "oversized-quality", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "640", "101") },
  { name: "non-numeric-quality", kind: "abuse", pathname: imagePath("/assets/werkles-logo.png", "640", "best") },
  {
    name: "duplicate-url",
    kind: "abuse",
    pathname: "/_next/image?url=%2Fassets%2Fwerkles-logo.png&url=%2Fprivacy&w=640&q=75"
  },
  {
    name: "duplicate-width",
    kind: "abuse",
    pathname: "/_next/image?url=%2Fassets%2Fwerkles-logo.png&w=640&w=750&q=75"
  }
];

const sequential = [];
for (const testCase of cases) sequential.push(await probe(testCase));

const burstCases = Array.from({ length: 16 }, (_, index) => ({
  name: `bounded-cache-burst-${index + 1}`,
  kind: "valid",
  pathname: imagePath("/assets/draft/squibb-bellows-v1/werkles-squibb-bellows-lesson-card-v1.png")
}));
const burst = await Promise.all(burstCases.map(probe));
const all = [...sequential, ...burst];
const failures = all.filter((result) => !result.pass);
const report = {
  schema: "werkles.vpg44-ender-image-abuse-red-team/v1",
  origin,
  created_at: new Date().toISOString(),
  pass: failures.length === 0,
  counts: {
    sequential_cases: sequential.length,
    valid_sequential: cases.filter((entry) => entry.kind === "valid").length,
    abuse_sequential: cases.filter((entry) => entry.kind === "abuse").length,
    bounded_concurrent_requests: burst.length,
    total_http_requests: all.length,
    failures: failures.length
  },
  sequential,
  burst,
  failures
};

if (output) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
