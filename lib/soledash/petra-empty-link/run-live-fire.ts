import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { loadPetraEmptyLinkConfig, configPath } from "./config";
import type {
  LiveFireApiResult,
  LiveFireFailureClass,
  LiveFirePacket,
  LiveFirePhaseEntry,
  LiveFireReceipt
} from "./types";

const ROOT = process.cwd();
const RECEIPTS_DIR = path.join(ROOT, "foreman", "soledash", "receipts");
const ACTIONS_DIR = path.join(ROOT, "foreman", "soledash", "actions");
const PETRA_DELIVER_SCRIPT = path.join(ROOT, "scripts", "foreman", "soledash-petra-deliver.mjs");

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function rel(p: string): string {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

function shortError(raw: string | null): string | null {
  if (!raw) return null;
  const line = raw.split(/\r?\n/).find((l) => l.trim())?.trim() ?? raw.trim();
  return line.slice(0, 280);
}

function pushPhase(phases: LiveFirePhaseEntry[], phase: LiveFirePhaseEntry["phase"], detail: string): void {
  phases.push({ phase, at: new Date().toISOString(), detail });
}

async function tryHttpPost(
  url: string,
  packet: LiveFirePacket,
  timeoutMs: number
): Promise<{ ok: boolean; status: number | null; body: string | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet),
      signal: controller.signal
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body: body.slice(0, 500), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "HTTP request failed";
    return { ok: false, status: null, body: null, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

async function tryPetraComposerTransport(
  packet: LiveFirePacket
): Promise<{
  attempted: boolean;
  ok: boolean;
  transport_engine: string | null;
  detail: string | null;
  error: string | null;
}> {
  if (process.platform !== "win32") {
    return {
      attempted: false,
      ok: false,
      transport_engine: null,
      detail: null,
      error: "Petra composer transport requires LOCAL_SALLY_WINDOWS"
    };
  }

  const text = `${packet.message}\n\npacket_id: ${packet.packet_id}\nsource: ${packet.source}\ntarget: ${packet.target}\ntimestamp: ${packet.timestamp}`;

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [PETRA_DELIVER_SCRIPT, "--text", text], {
      cwd: ROOT,
      windowsHide: true,
      env: process.env
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      resolve({
        attempted: true,
        ok: false,
        transport_engine: null,
        detail: null,
        error: "Petra transport timed out after 90s"
      });
    }, 90000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        attempted: true,
        ok: false,
        transport_engine: null,
        detail: null,
        error: err.message
      });
    });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(stdout.trim()) as {
          ok?: boolean;
          envelope?: { transport_engine?: string | null; delivery_status?: string; failure_reason?: string | null };
          error?: string;
        };
        const engine = parsed.envelope?.transport_engine ?? null;
        const status = parsed.envelope?.delivery_status ?? "unknown";
        const fail = parsed.envelope?.failure_reason ?? parsed.error ?? null;
        resolve({
          attempted: true,
          ok: Boolean(parsed.ok),
          transport_engine: engine,
          detail: `Petra transport ${status}${engine ? ` via ${engine}` : ""}`,
          error: parsed.ok ? null : fail
        });
      } catch {
        resolve({
          attempted: true,
          ok: false,
          transport_engine: null,
          detail: null,
          error: stderr.trim() || stdout.trim() || "Petra transport returned invalid JSON"
        });
      }
    });
  });
}

function writeReceiptFiles(receipt: LiveFireReceipt): { receipt_path: string; action_path: string } {
  ensureDir(RECEIPTS_DIR);
  ensureDir(ACTIONS_DIR);

  const receiptFile = path.join(RECEIPTS_DIR, `${receipt.action_id}.json`);
  fs.writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

  const action = {
    action_id: receipt.action_id,
    action: "live_fire_petra_empty_link",
    proposal_id: "LIVE_FIRE",
    phase: receipt.success ? "resolved" : "failed",
    updated_at: receipt.updated_at,
    message: receipt.success
      ? `LIVE FIRE delivered — ${receipt.outbound_path}`
      : `LIVE FIRE failed — ${receipt.failure_class ?? "failed"}: ${receipt.error ?? "unknown"}`,
    route_owner: "Petra",
    simulated: false,
    failure_reason: receipt.error
  };
  const actionFile = path.join(ACTIONS_DIR, `${receipt.action_id}.json`);
  fs.writeFileSync(actionFile, `${JSON.stringify(action, null, 2)}\n`, "utf8");

  return { receipt_path: rel(receiptFile), action_path: rel(actionFile) };
}

export async function runPetraEmptyLinkLiveFire(): Promise<LiveFireApiResult> {
  const config = loadPetraEmptyLinkConfig();
  const phases: LiveFirePhaseEntry[] = [];
  const now = new Date().toISOString();
  const packetId = `lf_petra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = packetId;

  const packet: LiveFirePacket = {
    packet_id: packetId,
    timestamp: now,
    source: "Starship Explode",
    target: "Petra",
    message: "LIVE FIRE TEST"
  };

  pushPhase(phases, "packet_created", `Packet ${packetId} created`);

  const outboundAbs = path.join(ROOT, config.outbound_dir);
  ensureDir(outboundAbs);
  const outboundFile = path.join(outboundAbs, `${packetId}.json`);
  fs.writeFileSync(outboundFile, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  const outboundPath = rel(outboundFile);

  pushPhase(phases, "send_attempted", `Exposed at ${outboundPath}`);

  let failureClass: LiveFireFailureClass = null;
  let error: string | null = null;
  let success = false;
  let outboundUrl: string | null = null;
  let transportEngine: string | null = null;
  let nextMissing = "Configure PETRA_EMPTY_LINK.json endpoint_url for HTTP probe, or keep Aeye Crew Bay Petra tab open for composer paste.";

  const hasHttp = Boolean(config.endpoint_url);
  const hasComposerPath = process.platform === "win32";

  if (!hasHttp && !hasComposerPath) {
    failureClass = "no_target_link_configured";
    error = `No HTTP endpoint in ${rel(configPath())} and Petra composer transport unavailable off Windows.`;
    nextMissing = "Add endpoint_url to PETRA_EMPTY_LINK.json or run on LOCAL_SALLY_WINDOWS with Edge Petra tab.";
    pushPhase(phases, "failed", error);
  } else {
    pushPhase(phases, "awaiting_response", hasHttp ? "HTTP POST pending" : "Petra composer transport pending");

    let httpOk = false;
    let httpAttempted = false;
    let transportOk = false;
    let transportAttempted = false;

    if (hasHttp && config.endpoint_url) {
      httpAttempted = true;
      outboundUrl = config.endpoint_url;
      const http = await tryHttpPost(config.endpoint_url, packet, config.response_timeout_ms);
      if (http.error) {
        failureClass = "browser_cannot_reach_endpoint";
        error = `HTTP POST to ${config.endpoint_url} failed: ${http.error}`;
      } else if (!http.ok) {
        failureClass = "transmitted_but_no_receipt";
        error = `HTTP ${http.status ?? "?"} from ${config.endpoint_url}${http.body ? ` — ${http.body.slice(0, 120)}` : ""}`;
      } else {
        httpOk = true;
        transportEngine = "http_post";
      }
    }

    if (!httpOk && hasComposerPath) {
      transportAttempted = true;
      const transport = await tryPetraComposerTransport(packet);
      transportEngine = transport.transport_engine ?? transportEngine;
      if (transport.attempted && !transport.ok) {
        if (fs.existsSync(outboundFile)) {
          failureClass = failureClass ?? "file_written_but_not_transmitted";
          error =
          error ??
          shortError(transport.error) ??
          "Packet file exists on disk but Petra composer transport did not confirm delivery.";
        } else {
          failureClass = failureClass ?? "file_written_but_not_transmitted";
          error = error ?? "Outbound packet not persisted before transport attempt.";
        }
      } else if (transport.ok) {
        transportOk = true;
      }
    }

    if (httpOk || transportOk) {
      success = true;
      failureClass = null;
      error = null;
      pushPhase(
        phases,
        "receipt_returned",
        httpOk
          ? `HTTP ${outboundUrl} accepted packet`
          : `Petra composer transport reported success${transportEngine ? ` (${transportEngine})` : ""}`
      );
    } else if (!httpAttempted && !transportAttempted) {
      failureClass = "no_target_link_configured";
      error = "No outbound link mechanism available.";
      pushPhase(phases, "failed", shortError(error) ?? "Send failed");
    } else {
      if (!failureClass) {
        failureClass = "transmitted_but_no_receipt";
        error = error ?? "Send attempted but no confirming receipt from target link.";
      }
      pushPhase(phases, "failed", shortError(error) ?? "Send failed");
    }
  }

  const updatedAt = new Date().toISOString();
  error = shortError(error);
  const receipt: LiveFireReceipt = {
    action_id: actionId,
    packet_id: packetId,
    target: "Petra — LIVE FIRE TEST",
    owner: "Petra",
    created_at: now,
    updated_at: updatedAt,
    status: success ? "resolved" : "failed",
    receipt_link: `foreman/soledash/receipts/${actionId}.json`,
    simulated: false,
    live_fire_petra: true,
    packet,
    success,
    outbound_path: outboundPath,
    outbound_url: outboundUrl,
    transport_engine: transportEngine,
    failure_class: failureClass,
    error,
    next_missing_integration: nextMissing,
    phases
  };

  const { receipt_path } = writeReceiptFiles(receipt);

  if (success && !phases.some((p) => p.phase === "receipt_returned")) {
    pushPhase(phases, "receipt_returned", `Local receipt at ${receipt_path}`);
  }

  return {
    ok: success,
    packet,
    receipt,
    receipt_path,
    ui_should_refresh: true,
    failure_class: failureClass,
    error
  };
}
