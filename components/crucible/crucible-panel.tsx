"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { crucibleChecks, crucibleTrustCopy } from "@/lib/crucible";
import { copy } from "@/lib/copy";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { CrucibleProviderBanner } from "@/components/crucible/crucible-provider-banner";
import { launchPlaidLink } from "@/components/crucible/plaid-link-launcher";
import { InfraPreviewBanner } from "@/components/foundry/infra-preview-banner";
import { VerificationCard } from "./verification-card";

export function CruciblePanel() {
  const preview = isAppInfraPreview();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(
    preview ? copy.infraPreview.crucible : copy.crucible.readyStatus
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("check") === "identity" && searchParams.get("return") === "1") {
      setStatus(copy.crucible.providerIdentityReturn);
    }
  }, [searchParams]);

  async function completePlaidExchange(publicToken: string, accessToken: string) {
    const response = await fetch("/api/verification/funds/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ public_token: publicToken })
    });
    const payload = await response.json().catch(() => ({}));
    setStatus(payload.error || payload.label || copy.crucible.providerFundsVerified);
  }

  async function startCheck(check: (typeof crucibleChecks)[number]) {
    if (preview) {
      setStatus(copy.infraPreview.sandboxActionDisabled);
      return;
    }

    if (!check.route) {
      setStatus(copy.crucible.unavailableStatus);
      return;
    }

    setBusyKey(check.key);
    setStatus(copy.crucible.inspectingStatus);

    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setStatus(copy.crucible.loginRequired);
        return;
      }

      const response = await fetch(check.route, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(payload.error || copy.crucible.genericError);
        return;
      }

      if (payload.url && typeof payload.url === "string") {
        setStatus(copy.crucible.providerIdentityRedirect);
        window.location.href = payload.url;
        return;
      }

      if (payload.link_token && typeof payload.link_token === "string") {
        setStatus(copy.crucible.providerFundsLink);
        await launchPlaidLink(
          payload.link_token,
          (publicToken) => {
            void completePlaidExchange(publicToken, token);
          },
          () => setStatus(copy.crucible.providerFundsExit)
        );
        return;
      }

      setStatus(payload.error || payload.label || copy.crucible.claimPrepared);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.crucible.genericError);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="crucible-shell">
      <figure className="crucible-atmosphere crucible-atmosphere--chem" aria-hidden="true">
        <div className="crucible-atmosphere__wash" />
        <figcaption>{copy.uiPass.draftBadge}</figcaption>
      </figure>

      <InfraPreviewBanner detail={copy.infraPreview.crucible} />
      <CrucibleProviderBanner />

      <div className="ops-card crucible-hero-card workshop-facet--chem">
        <div className="card-heading">
          <p>{copy.crucible.pageEyebrow}</p>
          <h1>{copy.crucible.pageHeadline}</h1>
        </div>
        <p>{copy.crucible.intro}</p>
        <p className="muted">{copy.crucible.principle}</p>
        <div className="gate-list" aria-label="Crucible trust rules">
          {crucibleTrustCopy.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <p className="status-line" role="status">{status}</p>
        <p className="crucible-squibb-hint">{copy.squibb.crucible}</p>
      </div>

      <div className="crucible-state-grid" aria-label="Crucible workflow states">
        {copy.crucible.workflowStates.map((state) => (
          <article key={state.key} className="ops-card crucible-state-card">
            <h2>{state.title}</h2>
            <p>{state.summary}</p>
            <p className="muted">{state.memberNote}</p>
            <span className="tag">{state.cta}</span>
          </article>
        ))}
      </div>

      <div className="crucible-grid">
        {crucibleChecks.map((check) => (
          <VerificationCard
            key={check.key}
            check={check}
            busy={busyKey === check.key}
            previewDisabled={preview}
            onStart={startCheck}
          />
        ))}
      </div>
    </section>
  );
}
