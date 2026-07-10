#!/usr/bin/env node
"use strict";

/**
 * Werkles signup smoke — beta API + Supabase signUp probe (test email only).
 * Does not print secrets.
 */

const siteOrigin = process.env.WERKLES_SITE_ORIGIN || "https://werkles.com";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const stamp = Date.now();
const testEmail = `signup-smoke+${stamp}@werkles.com`;
const checks = [];

function pass(name, detail) {
  checks.push({ name, pass: true, detail });
}

function fail(name, detail) {
  checks.push({ name, pass: false, detail });
}

async function probeBetaApi() {
  const url = `${siteOrigin.replace(/\/$/, "")}/api/beta`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, lane: "Builder" })
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok && body.success) {
    pass("beta_api_post", `HTTP ${res.status} success for ${testEmail}`);
    return;
  }
  fail("beta_api_post", `HTTP ${res.status} ${body.error || JSON.stringify(body)}`);
}

async function probeSignupPage() {
  const res = await fetch(`${siteOrigin.replace(/\/$/, "")}/signup`);
  const html = await res.text();
  if (!res.ok) {
    fail("signup_page_load", `HTTP ${res.status}`);
    return;
  }
  if (/Sign-up disabled \(preview\)/i.test(html)) {
    fail("signup_page_enabled", "Signup form is preview-blocked on production");
    return;
  }
  if (!/Start your profile/i.test(html)) {
    fail("signup_page_copy", "Expected signup copy missing");
    return;
  }
  pass("signup_page_enabled", `HTTP ${res.status} — signup form present`);
}

async function probeSupabaseSignUp() {
  if (!supabaseUrl || !supabaseAnon) {
    fail("supabase_signup_probe", "Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY in env");
    return;
  }

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
      Authorization: `Bearer ${supabaseAnon}`
    },
    body: JSON.stringify({
      email: testEmail,
      password: `SmokeTest!${stamp}`,
      data: { smoke_test: true }
    })
  });

  const body = await res.json().catch(() => ({}));
  if (res.status === 200 || res.status === 201) {
    const hasUser = Boolean(body.id || body.user?.id);
    const needsConfirm = !body.access_token && !body.session;
    pass(
      "supabase_signup_probe",
      hasUser
        ? needsConfirm
          ? "User created — confirmation email should be sent if Supabase SMTP is configured"
          : "User created with session (confirm email may be off)"
        : `HTTP ${res.status} odd body shape`
    );
    return;
  }

  fail("supabase_signup_probe", `HTTP ${res.status} ${body.msg || body.error_description || body.error || ""}`);
}

async function main() {
  await probeSignupPage();
  await probeBetaApi();
  await probeSupabaseSignUp();

  const ok = checks.every((c) => c.pass);
  const out = {
    ok,
    schema: "WERKLES_SIGNUP_SMOKE_V1",
    timestamp: new Date().toISOString(),
    site_origin: siteOrigin,
    test_email: testEmail,
    checks,
    notes: [
      "Homepage beta form saves to beta_signups — no automated email (manual follow-up).",
      "Full account at /signup uses Supabase — user must receive confirmation if email confirmations enabled.",
      "Existing members should use /login, not re-signup."
    ]
  };
  process.stdout.write(`${JSON.stringify(out)}\n`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  process.stdout.write(
    `${JSON.stringify({
      ok: false,
      schema: "WERKLES_SIGNUP_SMOKE_V1",
      error: err.message,
      checks
    })}\n`
  );
  process.exit(1);
});
