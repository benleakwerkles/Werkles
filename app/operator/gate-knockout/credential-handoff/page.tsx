import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateCredentialHandoff, type ProductGateCredentialStatus } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Credential Handoff | Werkles",
  description: "Full Human Gate tier list for password collection crew.",
  robots: { index: false, follow: false }
};

const tierNumbers = [...new Set(productGateCredentialHandoff.map((t) => t.tier))].sort((a, b) => a - b);

function statusLabel(status: ProductGateCredentialStatus) {
  switch (status) {
    case "completed":
      return "Completed";
    case "collect_now":
      return "Collect now";
    case "collect_planning":
      return "Collect for planning";
    case "policy_blocked":
      return "Policy blocked";
    case "optional":
      return "Optional";
    case "paused":
      return "Paused";
    default:
      return status;
  }
}

export default function CredentialHandoffPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Credential handoff navigation">
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/sign-in-hunt">Sign-In Hunt</Link>
          <Link href="/operator/gate-knockout/secret-entry">Secret Entry</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Password collection crew</p>
            <h1>Credential Handoff</h1>
          </div>
          <p>
            Full tier list for collecting operator logins and storing secrets in 1Password. Names only on this page —
            never paste secret values into chat, repo, or receipts.
          </p>
          <div className="trust-state-strip" aria-label="Crew rules">
            <span>Operator or designated crew only</span>
            <span>1Password vault: Werkles Automation</span>
            <span>Item: Werkles Vercel Secrets</span>
            <span>HG-1 + HG-2 approved 2026-07-07</span>
          </div>
          <p className="muted">
            Repo packet: <code>foreman/gates/WERKLES_PASSWORD_COLLECTION_CREW_HANDOFF.md</code>
          </p>
        </section>

        {tierNumbers.map((tier) => {
          const targets = productGateCredentialHandoff.filter((t) => t.tier === tier);
          if (targets.length === 0) return null;
          const tierLabel = targets[0]?.tierLabel ?? `Tier ${tier}`;

          return (
            <section className="ops-card gate-sign-in-hunt" key={tier} aria-labelledby={`cred-tier-${tier}`}>
              <div className="card-heading">
                <p>Tier {tier}</p>
                <h2 id={`cred-tier-${tier}`}>{tierLabel}</h2>
              </div>
              <ul className="gate-sign-in-hunt__list">
                {targets.map((target) => (
                  <li key={target.id} className="gate-sign-in-hunt__item">
                    <strong>{target.provider}</strong>
                    <p>
                      Status: <span className="tag">{statusLabel(target.status)}</span>
                    </p>
                    <p className="muted">{target.loginMethods}</p>
                    {target.gatePhrase ? (
                      <p>
                        Gate phrase: <code>{target.gatePhrase}</code>
                      </p>
                    ) : null}
                    {target.onePasswordVault ? (
                      <p>
                        1Password: {target.onePasswordVault}
                        {target.onePasswordItem ? ` → ${target.onePasswordItem}` : ""}
                      </p>
                    ) : null}
                    {target.fieldsToStore.length > 0 ? (
                      <p>
                        Fields (names only):{" "}
                        <code>{target.fieldsToStore.join(", ")}</code>
                      </p>
                    ) : null}
                    <p>{target.crewAction}</p>
                    <p className="muted">
                      <strong>Forbidden until:</strong> {target.forbiddenUntil}
                    </p>
                    {target.url.startsWith("http") ? (
                      <p>
                        <a className="button button-outline" href={target.url} rel="noreferrer" target="_blank">
                          Open console
                        </a>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </CockpitShell>
  );
}
