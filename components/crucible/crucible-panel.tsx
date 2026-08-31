"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { crucibleChecks, crucibleTrustCopy } from "@/lib/crucible";
import { copy } from "@/lib/copy";
import { isAppInfraPreview } from "@/lib/app-infra-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getClientAccessToken } from "@/lib/client-auth";
import { CrucibleProviderBanner } from "@/components/crucible/crucible-provider-banner";
import { launchPlaidLink } from "@/components/crucible/plaid-link-launcher";
import { plaidLinkLifecycleCopy } from "@/lib/crucible-plaid-lifecycle-copy";
import {
  cardStateForStoredVerificationStatus,
  normalizeStoredVerificationStatus,
  type OwnerCrucibleCardState
} from "@/lib/crucible-owner-status";
import { VerificationCard } from "./verification-card";
import { TechStackJourney } from "./tech-stack-journey";
import { GhostProviderWalkthrough } from "./ghost-provider-walkthrough";
import { MatchCheckContext } from "./match-check-context";
import type { CrucibleProviderRuntimeSnapshot } from "@/lib/crucible-provider-runtime";

export function CruciblePanel({
  showGhostPractice = false,
  providerRuntime = {}
}: {
  showGhostPractice?: boolean;
  providerRuntime?: CrucibleProviderRuntimeSnapshot;
}) {
  const preview = isAppInfraPreview();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(
    preview ? copy.infraPreview.crucible : copy.crucible.readyStatus
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [providerAccess, setProviderAccess] = useState<"checking" | "connected" | "practice_only">("checking");
  const [ownerCheckStates, setOwnerCheckStates] = useState<Record<string, OwnerCrucibleCardState>>({});

  useEffect(() => {
    if (searchParams.get("check") === "identity" && searchParams.get("return") === "1") {
      setStatus(copy.crucible.providerIdentityReturn);
    }
  }, [searchParams]);

  useEffect(() => {
    function openLinkedCheck() {
      if (!window.location.hash.startsWith("#check-")) return;
      setCatalogOpen(true);
      const cards = document.querySelectorAll<HTMLDetailsElement>("details.verification-workflow-card");
      const requested = document.getElementById(window.location.hash.slice(1));
      const target = requested instanceof HTMLDetailsElement ? requested : null;
      if (!(target instanceof HTMLDetailsElement)) return;
      cards.forEach((card) => {
        if (card !== target) card.open = false;
      });
      target.open = true;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      });
    }

    function openCatalog() {
      setCatalogOpen(true);
    }

    openLinkedCheck();
    window.addEventListener("hashchange", openLinkedCheck);
    window.addEventListener("werkles:open-check-catalog", openCatalog);
    return () => {
      window.removeEventListener("hashchange", openLinkedCheck);
      window.removeEventListener("werkles:open-check-catalog", openCatalog);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getClientAccessToken().then((token) => {
      if (!active) return;
      const connected = Boolean(token && token !== "dev-preview-token");
      setProviderAccess(connected ? "connected" : "practice_only");
      if (!connected) setStatus("Choose a practice check below. Provider tests require a connected test member account.");
    }).catch(() => {
      if (active) setProviderAccess("practice_only");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (preview || providerAccess !== "connected") return;

    let active = true;

    async function loadOwnerVerificationStatus() {
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;

        const response = await fetch("/api/verification/status", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        if (!response.ok) return;

        const raw = await response.json().catch(() => null);
        const identity = normalizeStoredVerificationStatus(raw?.identity);
        const funds = raw?.funds === "legacy_unbacked" ? "legacy_unbacked" : "none";
        if (!active) return;

        setOwnerCheckStates({
          identity: cardStateForStoredVerificationStatus(identity),
          funds: cardStateForStoredVerificationStatus(funds)
        });
      } catch {
        // The auth guard owns login errors; cards retain their safe default state.
      }
    }

    void loadOwnerVerificationStatus();
    return () => {
      active = false;
    };
  }, [preview, providerAccess]);

  function applyStoredStatus(checkKey: string, value: unknown) {
    if (checkKey !== "identity" && checkKey !== "funds") return;
    const storedStatus =
      checkKey === "funds" ? "ready_to_start" : cardStateForStoredVerificationStatus(normalizeStoredVerificationStatus(value));
    setOwnerCheckStates((current) => ({
      ...current,
      [checkKey]: storedStatus
    }));
  }

  async function startCheck(check: (typeof crucibleChecks)[number]) {
    if (busyKey !== null) return;

    if (providerAccess !== "connected") {
      setStatus("Starting a provider test requires a connected test member account. The practice checks below remain available.");
      return;
    }

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

    let plaidLifecycleHandled = false;

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

      applyStoredStatus(check.key, payload.status);

      if (payload.url && typeof payload.url === "string") {
        setStatus(copy.crucible.providerIdentityRedirect);
        window.location.href = payload.url;
        return;
      }

      if (payload.link_token && typeof payload.link_token === "string") {
        setStatus(copy.crucible.providerFundsLink);
        await launchPlaidLink(
          payload.link_token,
          () => setStatus(copy.crucible.providerFundsConnectionDeferred),
          () => setStatus(copy.crucible.providerFundsExit),
          (snapshot) => {
            plaidLifecycleHandled = true;
            setStatus(plaidLinkLifecycleCopy(snapshot.state));
          }
        );
        return;
      }

      setStatus(payload.error || payload.label || copy.crucible.claimPrepared);
    } catch {
      if (plaidLifecycleHandled) return;
      setStatus(copy.crucible.genericError);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="crucible-shell">
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
      </div>

      <MatchCheckContext showEmpty={showGhostPractice} />

      <TechStackJourney />

      {showGhostPractice ? <GhostProviderWalkthrough /> : null}

      <details
        className="crucible-check-catalog"
        open={catalogOpen}
        onToggle={(event) => setCatalogOpen(event.currentTarget.open)}
      >
        <summary className="crucible-check-deck__heading">
          <div>
            <p className="eyebrow">Choose only what matters</p>
            <h2>Review a check before you run one.</h2>
            <p>Open the full catalog only when one narrow fact could change the decision.</p>
          </div>
          <span>{catalogOpen ? "Hide" : "Open"} {crucibleChecks.length} checks</span>
        </summary>

        <div className="crucible-grid">
          {crucibleChecks.map((check) => (
            <VerificationCard
              key={check.key}
              check={check}
              state={ownerCheckStates[check.key] ?? check.state}
              busy={busyKey !== null}
              previewDisabled={preview}
              walkthroughReadOnly={providerAccess !== "connected"}
              providerRuntime={providerRuntime[check.key] ?? "unknown"}
              onStart={startCheck}
            />
          ))}
        </div>
      </details>
    </section>
  );
}
