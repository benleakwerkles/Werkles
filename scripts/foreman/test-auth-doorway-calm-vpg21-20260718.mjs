import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const login = read("app/login/page.tsx");
const signup = read("app/signup/page.tsx");

for (const source of [login, signup]) {
  assert.match(source, /const authAttemptRef = useRef\(false\)/);
  assert.match(source, /if \(authAttemptRef\.current\) return/);
  assert.match(source, /authAttemptRef\.current = true/);
  assert.match(source, /function unlockAuthAttempt\(\)/);
  assert.match(source, /authAttemptRef\.current = false/);
  assert.match(source, /setBusy\(false\)/);
  assert.doesNotMatch(source, /finally\s*\{/);
  assert.equal(source.match(/<details className="auth-help">/g)?.length, 1);
  assert.equal(source.match(/<summary>/g)?.length, 1);
  assert.doesNotMatch(source, /auth-doorway|Auth callback status|Open auth callback/);
}

const loginValidation = login.indexOf("if (!email.trim() || !password.trim())");
const loginGate = login.indexOf("if (authAttemptRef.current) return");
const loginLatch = login.indexOf("authAttemptRef.current = true");
const loginCall = login.indexOf(".auth.signInWithPassword");
assert.ok(loginValidation > -1 && loginValidation < loginGate);
assert.ok(loginGate < loginLatch && loginLatch < loginCall);
assert.equal(login.match(/\.auth\.signInWithPassword/g)?.length, 1);
assert.equal(login.match(/disabled=\{previewBlocked \|\| busy\}/g)?.length, 3);
assert.match(login, /aria-busy=\{busy\}/);
assert.match(login, /Logging in\.\.\./);
assert.equal(login.match(/href=\{signupHref\}/g)?.length, 1);
assert.doesNotMatch(login, /href="\/(?:proof|pricing)"/);
assert.match(login, /safeMemberReturnPath\(new URLSearchParams\(window\.location\.search\)\.get\("next"\)\)/);

const signupValidation = signup.indexOf("if (password !== confirm)");
const signupGate = signup.indexOf("if (authAttemptRef.current) return");
const signupLatch = signup.indexOf("authAttemptRef.current = true");
const signupCall = signup.indexOf(".auth.signUp");
assert.ok(signupValidation > -1 && signupValidation < signupGate);
assert.ok(signupGate < signupLatch && signupLatch < signupCall);
assert.equal(signup.match(/\.auth\.signUp/g)?.length, 1);
assert.equal(signup.match(/disabled=\{previewBlocked \|\| busy\}/g)?.length, 4);
assert.match(signup, /aria-busy=\{busy && !confirmationPending\}/);
assert.match(signup, /setConfirmationPending\(true\)/);
assert.match(signup, /confirmationPending\s*\? "Check your email"/);
assert.match(signup, /catch \{[\s\S]*publicAuthMessage[\s\S]*unlockAuthAttempt\(\)/);
assert.equal(signup.match(/\/login\?next=\$\{encodeURIComponent\(nextPath\)\}/g)?.length, 1);
assert.doesNotMatch(signup, /href="\/(?:proof|pricing)"/);
assert.match(signup, /autoComplete="email"/);
assert.equal(signup.match(/autoComplete="new-password"/g)?.length, 2);
assert.equal(signup.match(/minLength=\{8\}/g)?.length, 2);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "sync_ref_latch_precedes_each_auth_call",
        "recoverable_failure_unlock_has_no_finally",
        "successful_or_confirmation_pending_signup_stays_locked",
        "all_auth_fields_and_submit_controls_share_busy_lock",
        "login_has_one_destination_preserving_signup_path",
        "signup_has_one_destination_preserving_login_path",
        "each_doorway_has_one_short_native_disclosure",
        "core_form_validation_and_autocomplete_remain"
      ]
    },
    null,
    2
  )
);
