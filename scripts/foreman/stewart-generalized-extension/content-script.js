(() => {
  "use strict";
  const runtime = globalThis.PookaKindStewartExtensionRuntime;
  if (!runtime) return;
  let descriptor = null;
  let executed = false;
  let failedClosed = false;
  const completed = new Set();
  const keyFor = (value) => JSON.stringify(value);
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return false;
    if (message.schema === "pookakind.stewart-extension-synthetic-terminal/v1") {
      try {
        if (location.href !== "https://stewart-synthetic.pookakind.invalid/v1/native-host-round-trip"
          || message.state !== "PASS" || !/^[a-f0-9]{64}$/.test(message.provider_state_sha256 || "")
          || document.querySelector('meta[name="pookakind-stewart-synthetic-terminal"]')) return false;
        const marker = document.createElement("meta");
        marker.name = "pookakind-stewart-synthetic-terminal";
        marker.dataset.state = "PASS";
        marker.dataset.providerStateSha256 = message.provider_state_sha256;
        document.head.append(marker);
        document.dispatchEvent(new CustomEvent("pookakind-stewart-synthetic-terminal"));
        sendResponse({ state: "SYNTHETIC_TERMINAL_RECEIPT_PROJECTED" });
      } catch { return false; }
      return true;
    }
    if (failedClosed) return false;
    try {
      if (message.schema === "pookakind.stewart-extension-describe/v1") {
        const key = keyFor(message.descriptor);
        if (completed.has(key) || (descriptor && keyFor(descriptor) !== key) || executed) throw new Error("STEWART_EXTENSION_STAGE_CONFLICT");
        descriptor = message.descriptor;
        sendResponse(runtime.observe(descriptor));
      } else if (message.schema === "pookakind.stewart-extension-execute-fields/v1" && descriptor && !executed) {
        executed = true;
        const result = runtime.execute(descriptor, message.fields);
        sendResponse(result);
      } else if (message.schema === "pookakind.stewart-extension-bind-readback/v1") {
        const key = keyFor(message.descriptor);
        if (completed.has(key) || (descriptor && keyFor(descriptor) !== key)) throw new Error("STEWART_EXTENSION_READBACK_CONFLICT");
        descriptor = message.descriptor;
        sendResponse({ schema: "pookakind.stewart-extension-readback-bound/v1" });
      } else if (message.schema === "pookakind.stewart-extension-readback-request/v1" && descriptor) {
        const result = runtime.readback(descriptor);
        completed.add(keyFor(descriptor));
        descriptor = null; executed = false; sendResponse(result);
      } else return false;
    } catch {
      failedClosed = true; descriptor = null; sendResponse({ schema: "pookakind.stewart-extension-failure/v1", state: "FAILED_CLOSED" });
    }
    return true;
  });
  if (location.href === "https://stewart-synthetic.pookakind.invalid/v1/native-host-round-trip") {
    let started = false;
    addEventListener("message", (event) => {
      if (started || event.source !== window || event.origin !== location.origin
        || event.data?.schema !== "pookakind.stewart-synthetic-start/v1") return;
      started = true;
      chrome.runtime.sendMessage({ schema: "pookakind.stewart-extension-page-ready/v1" });
    });
  } else {
    chrome.runtime.sendMessage({ schema: "pookakind.stewart-extension-page-ready/v1" });
  }
})();
