import type { Metadata } from "next";

import { SiteHeader } from "@/components/foundry/site-header";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Security at Werkles",
  description:
    "Werkles security leadership, product-security scope, and authorization boundaries for PookaKind, CredBro, and future Werkles automation products."
};

export default function SecurityPage() {
  return (
    <>
      <SiteHeader />

      <main className="narrative-act-page">
        <section className="narrative-act-body panel" aria-labelledby="security-title">
          <p className="eyebrow">Security at Werkles</p>
          <h1 id="security-title">Security leadership and scope</h1>
          <p>
            <strong>Ben Leak serves as Founder and Security Lead for Werkles.</strong> He is responsible for
            security architecture, credential protection, access controls, authorization boundaries, and
            defensive review across PookaKind, CredBro, and future Werkles automation products.
          </p>
        </section>

        <section className="narrative-act-body panel" aria-labelledby="security-work-title">
          <p className="eyebrow">Current work</p>
          <h2 id="security-work-title">Security is part of the product work</h2>
          <p>
            CredBro and related PookaKind capabilities are under active development. The work includes secure
            credential and secret handling, authentication and verification flows, least-privilege project
            authorization, approval boundaries, audit receipts, and safeguards against unauthorized access.
          </p>
          <p>
            This security function covers systems owned by Werkles and environments where the owner has expressly
            authorized the work. It does not authorize testing or access outside that boundary.
          </p>
        </section>

        <section className="narrative-act-body panel" aria-labelledby="security-claims-title">
          <p className="eyebrow">Plain-language boundary</p>
          <h2 id="security-claims-title">What Werkles is not claiming</h2>
          <p>
            Werkles does not currently claim an independent red team, penetration-testing accreditation, a paid
            bug-bounty program, ISO/IEC 27001 certification, or a SOC 2 Type II report. This page documents the
            company&apos;s internal security leadership and product-security responsibilities.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <p>Security leadership statement updated October 28, 2026.</p>
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
