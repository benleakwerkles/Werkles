import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { productGateSignInHunt, type ProductGateSignInTier } from "@/lib/product-human-gates";

export const metadata: Metadata = {
  title: "Sign-In Hunt | Werkles",
  description: "Ordered provider sign-in list for Human Gate sessions.",
  robots: { index: false, follow: false }
};

const tierOrder: ProductGateSignInTier[] = ["v0_ship", "github_push", "crucible_later", "optional"];

function targetsForTier(tier: ProductGateSignInTier) {
  return productGateSignInHunt.filter((target) => target.tier === tier);
}

export default function SignInHuntPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Sign-in hunt navigation">
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/gate-knockout/provider-queue">Provider Queue</Link>
          <Link href="/operator/gate-knockout/secret-entry">Secret Entry</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Authenticator hunt</p>
            <h1>Sign-In Hunt</h1>
          </div>
          <p>
            Open each console, sign in yourself, complete the gate work, and say the gate phrase when done. Agents open
            links only — never enter passwords, 2FA codes, or secrets.
          </p>
          <div className="trust-state-strip" aria-label="Hunt rules">
            <span>Ben-only login</span>
            <span>No secrets in chat</span>
            <span>v0 first: Supabase → Vercel → Stripe</span>
          </div>
        </section>

        {tierOrder.map((tier) => {
          const targets = targetsForTier(tier);
          if (targets.length === 0) return null;
          const tierLabel = targets[0]?.tierLabel ?? tier;

          return (
            <section className="ops-card gate-sign-in-hunt" key={tier} aria-labelledby={`hunt-${tier}`}>
              <div className="card-heading">
                <p>Tier</p>
                <h2 id={`hunt-${tier}`}>{tierLabel}</h2>
              </div>
              <ul className="gate-sign-in-hunt__list">
                {targets.map((target) => (
                  <li key={`${target.provider}:${target.order}`} className="gate-sign-in-hunt__item">
                    <strong>{target.provider}</strong>
                    <p className="muted">{target.authenticatorNote}</p>
                    {target.gatePhrase ? (
                      <p>
                        Gate phrase: <code>{target.gatePhrase}</code>
                      </p>
                    ) : null}
                    <p>
                      <a className="button button-outline" href={target.url} rel="noreferrer" target="_blank">
                        Open sign-in
                      </a>
                    </p>
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
