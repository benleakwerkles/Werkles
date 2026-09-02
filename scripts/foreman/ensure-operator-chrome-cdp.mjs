#!/usr/bin/env node
/**
 * Wire Ben's normal Chrome (Default profile, existing sessions) for courier dispatch.
 * Chrome only exposes DevTools when started with --remote-debugging-port. If Chrome is
 * already running without that flag, new flags are ignored — quit Chrome first.
 */
import fs from "node:fs";
import { spawn } from "node:child_process";
import {
  OPERATOR_CHROME_USER_DATA,
  cdpVersion,
  scanCdpEndpoints
} from "./chrome-cdp-discover.mjs";

const PORT = Number(process.env.AEYE_CDP_PORT || 9222);

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
    : null
].filter(Boolean);

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("Chrome not found");
}

async function main() {
  const existing = await cdpVersion(PORT);
  if (existing) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          alreadyUp: true,
          port: PORT,
          browser: existing.Browser,
          note: "Operator Chrome already exposes DevTools on this port."
        },
        null,
        2
      )
    );
    return;
  }

  if (!fs.existsSync(OPERATOR_CHROME_USER_DATA)) {
    throw new Error(`Chrome user data not found: ${OPERATOR_CHROME_USER_DATA}`);
  }

  const chrome = findChrome();
  const args = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${OPERATOR_CHROME_USER_DATA}`,
    "--no-first-run",
    "--no-default-browser-check",
    "https://chat.deepseek.com/"
  ];

  spawn(chrome, args, { detached: true, stdio: "ignore", windowsHide: false }).unref();

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const info = await cdpVersion(PORT);
    if (info) {
      const all = await scanCdpEndpoints();
      console.log(
        JSON.stringify(
          {
            ok: true,
            alreadyUp: false,
            port: PORT,
            browser: info.Browser,
            userDataDir: OPERATOR_CHROME_USER_DATA,
            otherCdpPorts: all.filter((e) => e.port !== PORT).map((e) => e.port),
            note:
              "If this opened a sign-in wall, Chrome was probably already running without DevTools. " +
              "Quit ALL Chrome windows, run this script again, then dispatch uses your saved sessions."
          },
          null,
          2
        )
      );
      return;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: false,
        port: PORT,
        hint:
          "Chrome did not expose DevTools. Quit every Chrome window (including background), " +
          "then run this script once. Your signed-in sessions live in the Default profile — " +
          "no second sign-in if you reopen the same profile with this flag."
      },
      null,
      2
    )
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
  process.exit(1);
});
