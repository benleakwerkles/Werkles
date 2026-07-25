#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const origin = argument("--origin");
const output = argument("--output");
if (!origin) throw new Error("--origin is required");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(entryPath));
    else files.push(entryPath);
  }
  return files;
}

function routeFromFile(file) {
  const normalized = file.replaceAll("\\", "/");
  const withoutRoot = normalized.replace(/^app/, "");
  const withoutLeaf = withoutRoot.replace(/\/(?:page|route)\.(?:tsx?|jsx?)$/, "");
  const withoutGroups = withoutLeaf.replace(/\/\([^/]+\)/g, "");
  return withoutGroups || "/";
}

function materializeRoute(route) {
  return route
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, "vpg44/read")
    .replace(/\[\.\.\.([^\]]+)\]/g, "vpg44/read")
    .replace(/\[([^\]]+)\]/g, "vpg44-sample");
}

function digest(text) {
  return createHash("sha256").update(text).digest("hex");
}

function declaredMethods(source) {
  const methods = new Set();
  const patterns = [
    /export\s+(?:async\s+)?function\s+(GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE)\b/g,
    /export\s+const\s+(GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE)\s*=/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) methods.add(match[1]);
  }
  return [...methods].sort();
}

function apiRisk(source, route) {
  const reasons = [];
  const checks = [
    ["internal-family", /^\/api\/(?:soledash|tinkerden|thinkit|nerdkle|speaker|operator)\b/],
    ["provider", /\b(?:stripe|supabase|plaid|openai|anthropic|vercel)\b/i],
    ["external-fetch", /\bfetch\s*\(/],
    ["process", /\b(?:child_process|spawn|spawnSync|exec|execFile|execSync)\b/],
    ["filesystem-write", /\b(?:writeFile|appendFile|mkdir|rm|unlink|rename|copyFile)\b/]
  ];
  for (const [name, pattern] of checks) {
    if (name === "internal-family" ? pattern.test(route) : pattern.test(source)) reasons.push(name);
  }
  return reasons;
}

async function request(pathname, init = {}) {
  const started = performance.now();
  const response = await fetch(`${origin}${pathname}`, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(10_000)
  });
  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const text = /(?:text|json|javascript|xml|html)/i.test(contentType)
    ? body.toString("utf8")
    : "";
  const leakPatterns = [
    /__nextjs_original-stack-frame/i,
    /Unhandled Runtime Error/i,
    /Call Stack/i,
    /node_modules[\\/]+next[\\/]+dist/i,
    /[A-Z]:\\(?:Users|w8)\\/i
  ];
  return {
    pathname,
    status: response.status,
    duration_ms: Math.round(performance.now() - started),
    bytes: body.length,
    content_type: contentType,
    location: response.headers.get("location"),
    cache_control: response.headers.get("cache-control"),
    vary: response.headers.get("vary"),
    x_content_type_options: response.headers.get("x-content-type-options"),
    body_sha256: digest(body),
    leak_patterns: leakPatterns.filter((pattern) => pattern.test(text)).map(String)
  };
}

async function runBounded(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function consume() {
    while (next < items.length) {
      const index = next;
      next += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = {
          pathname: typeof items[index] === "string" ? items[index] : items[index].route,
          error: error.message
        };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, consume));
  return results;
}

const appFiles = (await walk("app"))
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => /\/(?:page|route)\.(?:tsx?|jsx?)$/.test(file))
  .sort();
const pages = appFiles
  .filter((file) => /\/page\.(?:tsx?|jsx?)$/.test(file))
  .map((file) => ({ file, route: routeFromFile(file), request_path: materializeRoute(routeFromFile(file)) }));
const apiFiles = appFiles.filter((file) => /\/route\.(?:tsx?|jsx?)$/.test(file));
const apis = [];
for (const file of apiFiles) {
  const source = await readFile(file, "utf8");
  const route = routeFromFile(file);
  apis.push({
    file,
    route,
    request_path: materializeRoute(route),
    methods: declaredMethods(source),
    risk: apiRisk(source, route)
  });
}

const pageResults = await runBounded(pages, 4, (entry) => request(entry.request_path));
const safeApiReads = apis.filter((entry) =>
  (entry.methods.includes("GET") || entry.methods.includes("HEAD")) && entry.risk.length === 0
);
const apiReadResults = await runBounded(safeApiReads, 4, (entry) =>
  request(entry.request_path, { method: entry.methods.includes("GET") ? "GET" : "HEAD" })
);

const closedProbes = [
  {
    name: "anonymous-personal-delivery",
    pathname: "/api/bellows/recommendations/personal",
    init: { method: "GET" },
    expected_status: 401,
    expected_body: /Authentication required/
  },
  {
    name: "saving-closed",
    pathname: "/api/bellows/recommendations/packet",
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    },
    expected_status: 403,
    expected_body: /Blocked/
  },
  {
    name: "intake-closed",
    pathname: "/api/bellows/intake",
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    },
    expected_status: 503,
    expected_body: /Closed/
  }
];
const closedResults = [];
for (const probe of closedProbes) {
  const response = await fetch(`${origin}${probe.pathname}`, {
    ...probe.init,
    redirect: "manual",
    signal: AbortSignal.timeout(10_000)
  });
  const body = await response.text();
  closedResults.push({
    name: probe.name,
    pathname: probe.pathname,
    method: probe.init.method,
    status: response.status,
    expected_status: probe.expected_status,
    body_contract: probe.expected_body.test(body),
    cache_control: response.headers.get("cache-control"),
    vary: response.headers.get("vary"),
    pragma: response.headers.get("pragma"),
    x_content_type_options: response.headers.get("x-content-type-options")
  });
}

const requestFailures = [...pageResults, ...apiReadResults].filter((entry) =>
  entry.error || entry.status >= 500 || entry.leak_patterns?.length > 0
);
const boundaryFailures = closedResults.filter((entry) =>
  entry.status !== entry.expected_status
  || !entry.body_contract
  || (entry.name === "anonymous-personal-delivery"
    && (!/private/i.test(entry.cache_control ?? "")
      || !/no-store/i.test(entry.cache_control ?? "")
      || !/(^|,\s*)authorization(,|$)/i.test(entry.vary ?? "")))
);
const report = {
  schema: "werkles.vpg44-ender-runtime-red-team/v1",
  origin,
  created_at: new Date().toISOString(),
  pass: requestFailures.length === 0 && boundaryFailures.length === 0,
  inventory: {
    page_files: pages.length,
    api_files: apis.length,
    total_routes: pages.length + apis.length,
    page_reads: pageResults.length,
    safe_api_reads: apiReadResults.length,
    classified_api_not_read: apis.length - safeApiReads.length,
    closed_boundary_probes: closedResults.length,
    total_http_requests: pageResults.length + apiReadResults.length + closedResults.length
  },
  api_classification: apis.map(({ file, route, methods, risk }) => ({ file, route, methods, risk })),
  page_results: pageResults,
  api_read_results: apiReadResults,
  closed_results: closedResults,
  failures: [...requestFailures, ...boundaryFailures]
};

if (output) await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
