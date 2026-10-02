import { createHash } from "node:crypto";

import { canonicalJson } from "./station-crypto-core.mjs";

const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const textDigest = (value) => createHash("sha256").update(value, "utf8").digest("hex");

export const STEWART_SYNTHETIC_ORIGIN = "https://stewart-synthetic.pookakind.invalid";
export const STEWART_SYNTHETIC_PATH = "/v1/native-host-round-trip";
export const STEWART_SYNTHETIC_URL = `${STEWART_SYNTHETIC_ORIGIN}${STEWART_SYNTHETIC_PATH}`;

const identityControl = digest({ fixture: "STEWART_GENERALIZED_NATIVE_ROUND_TRIP", role: "IDENTITY", selector: "#identity" });
const passwordControl = digest({ fixture: "STEWART_GENERALIZED_NATIVE_ROUND_TRIP", role: "CURRENT_PASSWORD", selector: "#password" });
const finalControl = digest({ fixture: "STEWART_GENERALIZED_NATIVE_ROUND_TRIP", role: "FINAL_CONTROL", selector: "#submit" });

export const STEWART_SYNTHETIC_DESCRIPTOR = Object.freeze({
  schema: "pookakind.stewart-provider-surface-descriptor/v1",
  field_descriptors: Object.freeze([
    Object.freeze({ role: "IDENTITY", control_sha256: identityControl, selector: "#identity" }),
    Object.freeze({ role: "CURRENT_PASSWORD", control_sha256: passwordControl, selector: "#password" }),
  ]),
  final_control_descriptor: Object.freeze({ control_sha256: finalControl, selector: "#submit" }),
  readback_descriptors: Object.freeze([
    Object.freeze({ response_class: "PROVIDER_ACCEPTED", selector: "#accepted" }),
    Object.freeze({ response_class: "PROVIDER_REJECTED", selector: "#rejected" }),
  ]),
});

export const STEWART_SYNTHETIC_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Stewart Native Round Trip</title></head>
<body><main><form id="synthetic-form"><label>Identity<input id="identity" autocomplete="off"></label><label>Credential<input id="password" type="password" autocomplete="off"></label><button id="submit" type="submit">Submit synthetic fixture</button></form></main>
<script>document.querySelector("#synthetic-form").addEventListener("submit",event=>{event.preventDefault();if(document.querySelector("#accepted"))return;const marker=document.createElement("div");marker.id="accepted";marker.hidden=true;document.body.append(marker);});</script></body></html>`;

export const STEWART_SYNTHETIC_FIXTURE_PINS = Object.freeze({
  schema: "pookakind.stewart-generalized-https-synthetic-fixture-pins/v1",
  origin: STEWART_SYNTHETIC_ORIGIN,
  path: STEWART_SYNTHETIC_PATH,
  url: STEWART_SYNTHETIC_URL,
  html_sha256: textDigest(STEWART_SYNTHETIC_HTML),
  descriptor_sha256: digest(STEWART_SYNTHETIC_DESCRIPTOR),
  field_controls_sha256: digest(STEWART_SYNTHETIC_DESCRIPTOR.field_descriptors.map(({ role, control_sha256 }) => ({ role, control_sha256 }))),
  final_control_sha256: finalControl,
  operation_kind: "SIGN_IN",
  provider_contacted: false,
  material_class: "FIXED_NONSECRET_SYNTHETIC_ONLY",
});

export function validateStewartSyntheticTerminalProjection(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "provider_state_sha256,state"
    || value.state !== "PASS" || !/^[a-f0-9]{64}$/.test(value.provider_state_sha256 ?? "")) {
    throw new Error("STEWART_SYNTHETIC_TERMINAL_PROJECTION_INVALID");
  }
  return Object.freeze({
    schema: "pookakind.stewart-generalized-session-synthetic-receipt/v1",
    state: "PASS",
    provider_state_sha256: value.provider_state_sha256,
    fixture_html_sha256: STEWART_SYNTHETIC_FIXTURE_PINS.html_sha256,
    fixture_descriptor_sha256: STEWART_SYNTHETIC_FIXTURE_PINS.descriptor_sha256,
    provider_contacted: false,
    secret_material_used: false,
    input_devices_touched: false,
    foreground_changed: false,
  });
}
