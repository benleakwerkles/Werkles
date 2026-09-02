#!/usr/bin/env node
"use strict";

const needle = (process.argv[2] || "amiriavets").toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  process.stdout.write(JSON.stringify({ ok: false, error: "Missing Supabase env" }) + "\n");
  process.exit(1);
}

async function queryBeta() {
  const res = await fetch(
    `${url}/rest/v1/beta_signups?select=id,email,lane,signed_up_at&email=ilike.*${encodeURIComponent(needle)}*&order=signed_up_at.desc&limit=10`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    }
  );
  const body = await res.json().catch(() => []);
  return { status: res.status, rows: Array.isArray(body) ? body : [], error: Array.isArray(body) ? null : body };
}

async function queryAuthByEmail(email) {
  const res = await fetch(`${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  const body = await res.json().catch(() => ({}));
  const users = body.users || (body.id ? [body] : []);
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    confirmed_at: u.confirmed_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at
  }));
}

async function queryAuthUsers(needle) {
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=200`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  const body = await res.json().catch(() => ({}));
  const users = (body.users || []).filter((u) => (u.email || "").toLowerCase().includes(needle));
  return {
    status: res.status,
    matches: users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      confirmed_at: u.confirmed_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at
    })),
    error: body.msg || body.error || null
  };
}

async function main() {
  const variants = [
    needle,
    `${needle}@gmail.com`,
    `${needle}@yahoo.com`,
    `${needle}@outlook.com`,
    `${needle}@hotmail.com`,
    `amiria.vets@gmail.com`
  ].filter((v, i, a) => a.indexOf(v) === i);

  const beta = await queryBeta();
  const authScan = await queryAuthUsers(needle);
  const directAuth = [];
  for (const email of variants) {
    if (!email.includes("@") && email === needle) continue;
    const hits = await queryAuthByEmail(email.includes("@") ? email : `${email}@gmail.com`);
    directAuth.push(...hits);
  }
  const authMatches = [
    ...authScan.matches,
    ...directAuth.filter((u) => !authScan.matches.some((m) => m.id === u.id))
  ];

  const auth = { status: authScan.status, matches: authMatches, error: authScan.error };
  const out = {
    ok: true,
    schema: "WERKLES_SIGNUP_LOOKUP_V1",
    needle,
    timestamp: new Date().toISOString(),
    beta_signups: beta,
    auth_users: auth,
    interpretation: []
  };

  if (beta.rows.length > 0) {
    out.interpretation.push(
      "Found in beta_signups (homepage waitlist). That flow does NOT send automated email — manual follow-up only."
    );
  }
  if (auth.matches.length > 0) {
    for (const u of auth.matches) {
      if (u.email_confirmed_at || u.confirmed_at) {
        out.interpretation.push(`${u.email}: account exists and IS confirmed — use /login.`);
      } else {
        out.interpretation.push(
          `${u.email}: account exists but NOT confirmed — confirmation email may have failed or is in spam; resend from Supabase or try login/password reset.`
        );
      }
    }
  }
  if (beta.rows.length === 0 && auth.matches.length === 0) {
    out.interpretation.push("No record in beta_signups or auth.users for this needle — submit may have failed client-side or used a different email spelling.");
  }

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((err) => {
  process.stdout.write(JSON.stringify({ ok: false, error: err.message }) + "\n");
  process.exit(1);
});
