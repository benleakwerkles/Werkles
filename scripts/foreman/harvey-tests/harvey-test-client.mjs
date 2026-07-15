import { createHash, createHmac, randomUUID } from "node:crypto";

export const base = process.env.HARVEY_TEST_BASE_URL;
if (!base) throw new Error("HARVEY_TEST_BASE_URL is required");
export const secondaryBase = process.env.HARVEY_TEST_BASE_URL_SECONDARY;
if (!secondaryBase) throw new Error("HARVEY_TEST_BASE_URL_SECONDARY is required");
export const workspace = process.env.HARVEY_TEST_WORKSPACE;
if (!workspace) throw new Error("HARVEY_TEST_WORKSPACE is required");

export const canonicalHostnames = {
  Doss: "DOSS",
  Betsy: "BETSY",
  Spanzee: "SPANZEE",
  Medullina: "COURTNEY",
  Sally: "SALLY"
};

export const machineSecrets = {
  Doss: "harvey-test-doss-secret",
  Betsy: "harvey-test-betsy-secret",
  Spanzee: "harvey-test-spanzee-secret",
  Medullina: "harvey-test-medullina-secret",
  Sally: "harvey-test-sally-secret"
};

export function signedMachineHeaders({ method, route, machine, body }) {
  const hostname = canonicalHostnames[machine];
  const agent = `handeye-${machine.toLowerCase()}-${hostname.toLowerCase()}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomUUID().replaceAll("-", "");
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  const canonical = [method, route, machine, agent, timestamp, nonce, bodyHash].join("\n");
  return {
    "content-type": "application/json",
    "x-harvey-machine": machine,
    "x-harvey-agent-id": agent,
    "x-harvey-timestamp": timestamp,
    "x-harvey-nonce": nonce,
    "x-harvey-signature": createHmac("sha256", machineSecrets[machine]).update(canonical, "utf8").digest("hex")
  };
}

export async function jsonAt(targetBase, route, init = {}) {
  const response = await fetch(`${targetBase}${route}`, init);
  const body = await response.json();
  return { response, body };
}

export async function json(route, init = {}) {
  return jsonAt(base, route, init);
}

export async function createCommand(machine, action = "PING") {
  return json("/api/harvey/commands", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ machine, action, payload: {} })
  });
}

export async function updateCommand(machine, input) {
  return updateCommandAt(base, machine, input);
}

export async function updateCommandAt(targetBase, machine, input) {
  const route = "/api/harvey/commands";
  const body = JSON.stringify(input);
  return jsonAt(targetBase, route, {
    method: "PATCH",
    headers: signedMachineHeaders({ method: "PATCH", route, machine, body }),
    body
  });
}
