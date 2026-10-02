"use strict";
const NATIVE_HOST = "com.werkles.pookakind.stewart_generalized";
const SYNTHETIC_URL = "https://stewart-synthetic.pookakind.invalid/v1/native-host-round-trip";
const sessions = new Map();
const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(String(value)); const result = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(result)].map((item) => item.toString(16).padStart(2, "0")).join("");
};
const close = (tabId) => { const session = sessions.get(tabId); if (session) { try { session.port.disconnect(); } catch {} sessions.delete(tabId); } };
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.schema !== "pookakind.stewart-extension-page-ready/v1" || !Number.isInteger(sender.tab?.id) || !sender.url?.startsWith("https://")) return false;
  void (async () => {
    const tabId = sender.tab.id; close(tabId);
    const port = chrome.runtime.connectNative(NATIVE_HOST);
    const session = { port, tabId, origin: new URL(sender.url).origin, url: sender.url, readbackSent: false, terminal: false }; sessions.set(tabId, session);
    port.onDisconnect.addListener(() => close(tabId));
    port.onMessage.addListener((frame) => {
      void (async () => {
        try {
          if (!frame || typeof frame !== "object" || session.terminal) throw new Error("FRAME_INVALID");
          if (frame.schema === "pookakind.stewart-extension-describe/v1" && !session.readbackSent) {
            const response = await chrome.tabs.sendMessage(tabId, frame); port.postMessage({ ...response, scope: frame.scope, sequence: 0 });
          } else if (frame.schema === "pookakind.stewart-extension-execute-fields/v1" && !session.readbackSent) {
            const response = await chrome.tabs.sendMessage(tabId, frame); port.postMessage({ ...response, scope: frame.scope, sequence: 2 });
          } else if (frame.schema === "pookakind.stewart-extension-readback-request/v1" && !session.readbackSent) {
            const response = await chrome.tabs.sendMessage(tabId, frame); session.readbackSent = true; port.postMessage({ ...response, scope: frame.scope, sequence: 4 });
          } else if (frame.schema === "pookakind.stewart-generalized-native-host-receipt/v1"
            && session.url === SYNTHETIC_URL && session.readbackSent
            && frame.state === "SUBMISSION_ACCEPTED"
            && /^[a-f0-9]{64}$/.test(frame.provider_state_sha256 || "")
            && frame.fixed === false && frame.password_conversion === false
            && frame.secret_material_returned === false && frame.recurring_operation_created === false) {
            session.terminal = true;
            await chrome.tabs.sendMessage(tabId, {
              schema: "pookakind.stewart-extension-synthetic-terminal/v1",
              state: "PASS",
              provider_state_sha256: frame.provider_state_sha256,
            });
            close(tabId);
          } else throw new Error("FRAME_INVALID");
        } catch { close(tabId); }
      })();
    });
    port.postMessage({ schema: "pookakind.stewart-extension-bootstrap/v1", extension_id_sha256: await sha256(chrome.runtime.id), tab_id_sha256: await sha256(String(tabId)), canonical_origin_sha256: await sha256(session.origin), route_epoch_sha256: await sha256(sender.url) });
    sendResponse({ state: "ONE_OPERATION_NATIVE_PORT_OPENED" });
  })().catch(() => sendResponse({ state: "FAILED_CLOSED" }));
  return true;
});
