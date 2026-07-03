import { parse } from "node:url";
import { getAuthContext, loginWithEmail, logout } from "./services/auth.js";
import {
  addIntro,
  clearIntros,
  getIntroQueue,
  getMatchingSnapshot,
  getProofStatus,
  removeIntro,
  setProofChecks,
  toggleShortlist,
  updateUserProfile,
} from "./services/workspace.js";
import { createBillingPortalSession, createCheckoutSession, getBillingStatus } from "./services/billing.js";
import { saveState } from "./store/index.js";

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function getToken(request) {
  const header = request.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

function requireAuth(request) {
  const token = getToken(request);
  const context = getAuthContext(token);
  if (!context) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
  return context;
}

export async function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = parse(request.url, true);
  const path = url.pathname;

  try {
    if (request.method === "GET" && path === "/health") {
      sendJson(response, 200, {
        service: "werkles-api",
        status: "ok",
        modules: ["auth", "matching", "proof", "intros", "billing"],
      });
      return;
    }

    if (request.method === "POST" && path === "/auth/login") {
      const body = await readBody(request);
      const result = loginWithEmail(body.email || "demo@werkles.local");
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && path === "/auth/logout") {
      logout(getToken(request));
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && path === "/auth/session") {
      const context = requireAuth(request);
      sendJson(response, 200, {
        user: context.user,
        workspace: context.workspace,
      });
      return;
    }

    if (request.method === "GET" && path === "/matching/snapshot") {
      const context = requireAuth(request);
      const snapshot = getMatchingSnapshot(context.user.id, url.query);
      sendJson(response, 200, snapshot);
      return;
    }

    if (request.method === "PUT" && path === "/matching/profile") {
      const context = requireAuth(request);
      const body = await readBody(request);
      const profile = updateUserProfile(context.user.id, body);
      saveState();
      sendJson(response, 200, { profile });
      return;
    }

    if (request.method === "GET" && path === "/proof/status") {
      const context = requireAuth(request);
      sendJson(response, 200, getProofStatus(context.user.id));
      return;
    }

    if (request.method === "PUT" && path === "/proof/status") {
      const context = requireAuth(request);
      const body = await readBody(request);
      const status = setProofChecks(context.user.id, body.checks || []);
      saveState();
      sendJson(response, 200, status);
      return;
    }

    if (request.method === "GET" && path === "/intros") {
      const context = requireAuth(request);
      sendJson(response, 200, { intros: getIntroQueue(context.user.id) });
      return;
    }

    if (request.method === "POST" && path === "/intros") {
      const context = requireAuth(request);
      const body = await readBody(request);
      const intros = addIntro(context.user.id, body.profileId);
      saveState();
      sendJson(response, 200, { intros });
      return;
    }

    if (request.method === "DELETE" && path.startsWith("/intros/")) {
      const context = requireAuth(request);
      const profileId = path.slice("/intros/".length);
      const intros = removeIntro(context.user.id, profileId);
      saveState();
      sendJson(response, 200, { intros });
      return;
    }

    if (request.method === "DELETE" && path === "/intros") {
      const context = requireAuth(request);
      const intros = clearIntros(context.user.id);
      saveState();
      sendJson(response, 200, { intros });
      return;
    }

    if (request.method === "POST" && path === "/matching/shortlist") {
      const context = requireAuth(request);
      const body = await readBody(request);
      const shortlist = toggleShortlist(context.user.id, body.profileId);
      saveState();
      sendJson(response, 200, { shortlist });
      return;
    }

    if (request.method === "GET" && path === "/billing/status") {
      const context = requireAuth(request);
      sendJson(response, 200, getBillingStatus(context.user.id));
      return;
    }

    if (request.method === "POST" && path === "/billing/checkout-session") {
      const context = requireAuth(request);
      const body = await readBody(request);
      const session = createCheckoutSession(context.user.id, body.planId);
      saveState();
      sendJson(response, 200, session);
      return;
    }

    if (request.method === "POST" && path === "/billing/portal-session") {
      const context = requireAuth(request);
      const session = createBillingPortalSession(context.user.id);
      sendJson(response, 200, session);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message });
  }
}
