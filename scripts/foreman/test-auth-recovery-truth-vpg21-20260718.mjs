import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTs(source) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(() => ({}), loaded.exports, loaded);
  return loaded.exports;
}

const authMessages = loadTs(read("lib/public-auth-message.ts"));
const publicAuthMessage = authMessages.publicAuthMessage;
const login = read("app/login/page.tsx");
const signup = read("app/signup/page.tsx");
const callback = read("app/auth/callback/page.tsx");

const cases = [
  [{ context: "login", code: "invalid_credentials" }, "That sign-in did not work."],
  [{ context: "callback", code: "otp_expired" }, "That confirmation link has expired."],
  [{ context: "signup", code: "over_email_send_rate_limit" }, "Too many attempts too quickly."],
  [{ context: "login", status: 429 }, "Too many attempts too quickly."],
  [{ context: "callback", code: "service_unavailable" }, "Werkles could not reach sign-in right now."],
  [{ context: "callback", code: "missing_confirmation" }, "This confirmation link is incomplete."],
  [{ context: "signup", code: "possible_existing_account" }, "We could not finish that signup."],
  [{ context: "login", code: "unknown" }, "We could not sign you in."],
  [{ context: "signup", code: "unknown" }, "We could not create the account."],
  [{ context: "callback", code: "unknown" }, "We could not confirm that link."]
];

for (const [input, prefix] of cases) {
  assert.match(publicAuthMessage(input), new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
}

const sentinel = "SENTINEL_PROVIDER_SECRET";
for (const context of ["login", "signup", "callback"]) {
  const output = publicAuthMessage({
    context,
    code: { message: sentinel, error_description: sentinel, provider: "Supabase" }
  });
  assert.doesNotMatch(output, new RegExp(sentinel));
  assert.doesNotMatch(output, /supabase|provider|operator|template|secret/i);
}

for (const source of [login, signup, callback]) {
  assert.doesNotMatch(source, /setStatus\(error\.message\)|error instanceof Error \? error\.message/);
  assert.doesNotMatch(source, /error_description|decodeAuthMessage|operator setup|email templates/i);
  assert.match(source, /publicAuthMessage/);
}

assert.match(callback, /type CallbackState =/);
assert.match(callback, /status: "checking" \| "redirecting"/);
assert.match(callback, /status: "failed"; message: string; nextPath: string/);
assert.match(callback, /const callbackStartedRef = useRef\(false\)/);
assert.ok(callback.indexOf("if (callbackStartedRef.current) return") < callback.indexOf("exchangeCodeForSession"));
assert.equal(callback.match(/exchangeCodeForSession/g)?.length, 1);
assert.equal(callback.match(/\.auth\.setSession/g)?.length, 1);
assert.equal(callback.match(/router\.replace\(onboardingHref\)/g)?.length, 2);
assert.match(callback, /setCallbackState\(\{ status: "redirecting"/);
assert.match(callback, /callbackState\.status === "failed"/);
assert.match(callback, /aria-label="Account recovery"/);
assert.match(callback, /aria-describedby="authCallbackStatus"/);
assert.match(callback, /\/login\?next=\$\{encodeURIComponent\(callbackState\.nextPath\)\}/);
assert.match(callback, /\/signup\?next=\$\{encodeURIComponent\(callbackState\.nextPath\)\}/);
assert.doesNotMatch(callback, /Continue to onboarding|Member home|Inspect proof/);
assert.doesNotMatch(callback, /href=\{`\/onboarding|href="\/dashboard"/);
assert.doesNotMatch(callback, /console\.(?:log|error|warn)/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "stable_auth_codes_map_to_closed_public_copy",
        "unknown_and_malicious_values_fail_closed",
        "provider_messages_and_descriptions_are_never_rendered",
        "callback_effect_is_guarded_before_session_work",
        "checking_and_redirecting_have_no_actions",
        "failed_callback_has_only_safe_login_signup_recovery",
        "code_and_hash_success_redirect_only_after_session_success",
        "safe_destination_remains_in_terminal_callback_state"
      ]
    },
    null,
    2
  )
);
