import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../data");

function readJson(filename, fallback) {
  const path = join(dataDir, filename);
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(filename, value) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

let stateCache = null;
let profilesCache = null;

export function getProfiles() {
  if (!profilesCache) {
    profilesCache = readJson("profiles.json", []);
  }
  return profilesCache;
}

export function getState() {
  if (!stateCache) {
    stateCache = readJson("state.json", {
      users: [],
      sessions: {},
      workspace: {},
      billing: {},
    });
  }
  return stateCache;
}

export function saveState() {
  writeJson("state.json", getState());
}

export function getUserByEmail(email) {
  return getState().users.find((user) => user.email === email) || null;
}

export function getUserById(userId) {
  return getState().users.find((user) => user.id === userId) || null;
}

export function getSession(token) {
  const session = getState().sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    delete getState().sessions[token];
    saveState();
    return null;
  }
  return session;
}

export function createSession(userId) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  getState().sessions[token] = { userId, expiresAt };
  saveState();
  return { token, expiresAt };
}

export function deleteSession(token) {
  delete getState().sessions[token];
  saveState();
}

export function ensureWorkspace(userId) {
  const state = getState();
  if (!state.workspace[userId]) {
    state.workspace[userId] = {
      shortlist: [],
      intros: [],
      proofChecks: ["identity"],
      profile: {
        role: "worker",
        industry: "plumbing",
        city: "Cleveland, OH",
        radius: 75,
        capitalAvailable: 50000,
        capitalNeeded: 0,
        skills: ["field"],
        goals: ["start"],
      },
    };
    saveState();
  }
  return state.workspace[userId];
}

export function getBilling(userId) {
  const state = getState();
  if (!state.billing[userId]) {
    state.billing[userId] = {
      status: "none",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    saveState();
  }
  return state.billing[userId];
}

export function setBilling(userId, patch) {
  const billing = getBilling(userId);
  Object.assign(billing, patch);
  saveState();
  return billing;
}
