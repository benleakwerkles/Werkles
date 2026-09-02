/**
 * Find any local Chrome (or Chromium) exposing DevTools protocol and prefer the
 * instance where a cousin seat is actually signed in — not a fixed crew profile.
 */
import os from "node:os";
import path from "node:path";

const SCAN_START = 9210;
const SCAN_END = 9360;

export const OPERATOR_CHROME_USER_DATA = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
  "Google",
  "Chrome",
  "User Data"
);

export const CREW_CHROME_USER_DATA = path.join(os.homedir(), ".werkles-aeye-crew-profile");

/** Ports checked first; full range 9210–9360 follows. */
export const PREFERRED_CDP_PORTS = [9222, 9335, 9223, 9333];

export async function cdpVersion(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(900) });
    if (!res.ok) return null;
    return { port, ...(await res.json()) };
  } catch {
    return null;
  }
}

export async function scanCdpEndpoints() {
  const ports = [...new Set(PREFERRED_CDP_PORTS)];
  for (let p = SCAN_START; p <= SCAN_END; p++) ports.push(p);

  const found = [];
  await Promise.all(
    ports.map(async (port) => {
      const info = await cdpVersion(port);
      if (info) found.push(info);
    })
  );
  return found.sort((a, b) => a.port - b.port);
}

async function seatReadyOnPort(port, seat) {
  const { chromium } = await import("playwright");
  let browser;
  try {
    browser = await Promise.race([
      chromium.connectOverCDP(`http://127.0.0.1:${port}`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("cdp_connect_timeout")), 4000))
    ]);
    for (const page of browser.contexts().flatMap((c) => c.pages())) {
      let url = "";
      try {
        url = page.url();
      } catch {
        continue;
      }
      if (!url.includes(seat.host)) continue;

      const state = await page
        .evaluate(() => {
          const body = (document.body.innerText || "").slice(0, 4000);
          const signIn = /sign in|log in|create account|continue with google/i.test(body);
          const email = body.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
          const composer = Boolean(
            document.querySelector("textarea#chat-input") ||
              document.querySelector("textarea") ||
              document.querySelector("div[contenteditable='true']")
          );
          return { signIn, email: email?.[0] || null, composer };
        })
        .catch(() => ({ signIn: true, email: null, composer: false }));

      if (state.composer && !state.signIn) {
        return { port, url, signedIn: true, email: state.email };
      }
      if (url.includes("/sign_in") || (state.signIn && !state.composer)) {
        return { port, url, signedIn: false, reason: "sign_in_wall" };
      }
      if (state.composer) {
        return { port, url, signedIn: true, email: state.email };
      }
      return { port, url, signedIn: false, reason: "no_composer" };
    }
    return { port, signedIn: false, reason: "no_tab" };
  } catch (e) {
    return { port, signedIn: false, reason: e.message };
  } finally {
    if (browser) browser.close().catch(() => {});
  }
}

/**
 * Pick the CDP port where `seat` is callable. Prefers signed-in routes over crew
 * profile defaults.
 */
export async function discoverPortForSeat(seat, { explicitPort } = {}) {
  const endpoints = await scanCdpEndpoints();
  if (endpoints.length === 0) {
    return {
      port: null,
      endpoints: [],
      seatState: null,
      hint: "No Chrome on localhost exposes DevTools. Quit Chrome fully, then run: node scripts/foreman/ensure-operator-chrome-cdp.mjs"
    };
  }

  const order = explicitPort
    ? [explicitPort, ...endpoints.map((e) => e.port).filter((p) => p !== explicitPort)]
    : endpoints.map((e) => e.port);

  let bestSignedIn = null;
  let bestAny = null;

  for (const port of order) {
    if (!endpoints.some((e) => e.port === port)) continue;
    const state = await seatReadyOnPort(port, seat);
    if (state.signedIn) {
      bestSignedIn = state;
      break;
    }
    if (!bestAny || state.reason === "sign_in_wall") bestAny = state;
  }

  const chosen = bestSignedIn || bestAny;
  return {
    port: chosen?.port ?? endpoints[0].port,
    endpoints,
    seatState: chosen,
    signedIn: Boolean(bestSignedIn)
  };
}

export async function connectCdp(port) {
  const info = await cdpVersion(port);
  if (!info) throw new Error(`No Chrome on 127.0.0.1:${port}`);
  const { chromium } = await import("playwright");
  return { browser: await chromium.connectOverCDP(`http://127.0.0.1:${port}`), info, port };
}
