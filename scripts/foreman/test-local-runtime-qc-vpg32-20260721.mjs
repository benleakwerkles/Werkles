import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const port = 3112;
const origin = `http://127.0.0.1:${port}`;
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [nextCli, "start", "-H", "127.0.0.1", "-p", String(port)], {
  cwd: root,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function request(pathname, init) {
  return fetch(`${origin}${pathname}`, { ...init, redirect: "manual", signal: AbortSignal.timeout(5000) });
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next server exited early.\n${serverOutput}`);
    try {
      const response = await request("/bellows/recommendations");
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next server did not become ready.\n${serverOutput}`);
}

async function jsonResponse(pathname, init) {
  const response = await request(pathname, init);
  const body = await response.json().catch(() => null);
  return { response, body };
}

try {
  await waitUntilReady();

  const recommendations = await request("/bellows/recommendations");
  const recommendationsHtml = await recommendations.text();
  assert.equal(recommendations.status, 200);
  assert.match(recommendationsHtml, /Rules score \d+ out of 100\. (?:Stronger|Moderate|Limited) rule support\./);

  const profile = await request("/dashboard/profile?next=%2Fbellows%2Frecommendations");
  assert.equal(profile.status, 200);

  const intake = await jsonResponse("/api/bellows/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  assert.equal(intake.response.status, 503);
  assert.equal(intake.body?.state, "Closed");

  const saving = await jsonResponse("/api/bellows/recommendations/packet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  assert.equal(saving.response.status, 403);
  assert.equal(saving.body?.state, "Blocked");

  const personal = await jsonResponse("/api/bellows/recommendations/personal");
  assert.equal(personal.response.status, 401);
  assert.equal(personal.body?.error, "Authentication required");
  assert.match(personal.response.headers.get("cache-control") ?? "", /private/);
  assert.match(personal.response.headers.get("cache-control") ?? "", /no-store/);
  const personalVary = (personal.response.headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase());
  assert.ok(personalVary.includes("authorization"));

  console.log(JSON.stringify({
    pass: true,
    origin,
    checks: {
      recommendations: recommendations.status,
      profile: profile.status,
      intake: { status: intake.response.status, state: intake.body?.state },
      saving: { status: saving.response.status, state: saving.body?.state },
      personal: {
        status: personal.response.status,
        error: personal.body?.error,
        cacheControl: personal.response.headers.get("cache-control"),
        vary: personal.response.headers.get("vary")
      }
    }
  }, null, 2));
} finally {
  server.kill();
  if (server.exitCode === null) {
    await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 3000))]);
  }
}
