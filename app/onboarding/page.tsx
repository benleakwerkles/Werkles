"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { getDevPreviewUser, shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { getClientAccessToken } from "@/lib/client-auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
import { NARRATIVE_V1_WIRE_ENABLED, narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { safeMemberReturnPath } from "@/lib/safe-member-return";

const RECOMMENDATION_RETURN_PATH = "/bellows/recommendations";

type Phase = "first-weld" | "doors" | "quick-weld" | "blueprint";

const collectionNoticeByPhase: Partial<Record<Phase, string>> = {
  "first-weld": "This step saves your lane, field, and ZIP-derived location to your signed-in profile.",
  "quick-weld": "This step saves the skills, goal, timeline, and work preference you enter to your signed-in profile.",
  blueprint: "This step saves your workshop narrative to your signed-in profile."
};

function splitTags(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OnboardingPage() {
  const [nextPath, setNextPath] = useState("/dashboard");
  const [phase, setPhase] = useState<Phase>("first-weld");
  const [status, setStatus] = useState("The machine needs lane, arena, and turf.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const safeNextPath = safeMemberReturnPath(params.get("next"));
    setNextPath(safeNextPath);
    if (safeNextPath === RECOMMENDATION_RETURN_PATH) {
      setStatus("Start with your lane, field, and ZIP. Then we'll open Profile Builder for your recommendation.");
    }
  }, []);

  const profileReturnHref = `/dashboard/profile?next=${encodeURIComponent(nextPath)}`;
  const isRecommendationJourney = nextPath === RECOMMENDATION_RETURN_PATH;
  const collectionNotice = collectionNoticeByPhase[phase];

  function goToProfile() {
    window.location.href = profileReturnHref;
  }

  function finishFirstWeld() {
    if (isRecommendationJourney) {
      setStatus("First Weld saved. Opening Profile Builder for your recommendation.");
      goToProfile();
      return;
    }

    setStatus(`${copy.onboarding.saved} Pick a door below, or go straight to Foundry Dues.`);
    setPhase("doors");
  }

  async function currentUser() {
    const devUser = getDevPreviewUser();
    if (devUser) return devUser;

    const supabase = getSupabaseBrowser();
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  async function saveFirstWeld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setStatus("Heating the first weld.");

    try {
      const lane = String(form.get("lane") || "Builder");
      const arena = String(form.get("arena") || "").trim();
      const turf = String(form.get("turf") || "").replace(/\D/g, "").slice(0, 5);

      if (!arena || turf.length !== 5) {
        setStatus("Arena and a valid ZIP are required.");
        return;
      }

      if (shouldUseDevPreviewAuth()) {
        finishFirstWeld();
        return;
      }

      const token = await getClientAccessToken();

      if (!token) {
        setStatus(copy.onboarding.loginRequired);
        return;
      }

      const response = await fetch("/api/onboarding/first-weld", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lane, arena, turf })
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error || copy.onboarding.zipFailed);
        return;
      }

      finishFirstWeld();
    } catch {
      setStatus("First weld jammed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseDepth(profileDepth: "full_audit" | "blueprint") {
    const user = await currentUser();
    if (!user) {
      setStatus("Log in before choosing a door.");
      return;
    }

    if (profileDepth === "blueprint") {
      setPhase("blueprint");
      return;
    }

    if (shouldUseDevPreviewAuth()) {
      goToProfile();
      return;
    }

    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({ profile_depth: profileDepth })
      .eq("id", user.id);

    if (error) {
      setStatus(error.message);
      return;
    }

    goToProfile();
  }

  async function saveQuickWeld(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setStatus("Locking the quick weld.");
    const user = await currentUser();
    if (!user) {
      setBusy(false);
      setStatus("Log in before saving.");
      return;
    }

    if (shouldUseDevPreviewAuth()) {
      setBusy(false);
      goToProfile();
      return;
    }

    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({
        profile_depth: "quick_weld",
        skills_offered: splitTags(form.get("skills_offered")),
        skills_sought: splitTags(form.get("skills_sought")),
        timeline_to_launch: String(form.get("timeline_to_launch") || "").trim() || null,
        primary_goal: String(form.get("primary_goal") || "").trim() || null,
        work_preference: String(form.get("work_preference") || "Local Only")
      })
      .eq("id", user.id);

    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    goToProfile();
  }

  async function saveBlueprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const narrative = String(form.get("blueprint_narrative") || "").trim();

    if (narrative.length < 20) {
      setStatus(copy.onboarding.workshopMinLength);
      return;
    }

    setBusy(true);
    setStatus("Rolling out the Workshop.");
    const user = await currentUser();
    if (!user) {
      setBusy(false);
      setStatus("Log in before saving.");
      return;
    }

    if (shouldUseDevPreviewAuth()) {
      setBusy(false);
      goToProfile();
      return;
    }

    const { error } = await getSupabaseBrowser()
      .from("profiles")
      .update({
        profile_depth: "blueprint",
        blueprint_narrative: narrative
      })
      .eq("id", user.id);

    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    goToProfile();
  }

  return (
    <>
    <main className="dashboard-main onboarding-page">
      <NarrativeJourneyRail currentSlug="/formation" />
      <nav className="dashboard-nav" aria-label="Onboarding navigation">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Member home</Link>
        <Link href="/formation">Formation</Link>
        <Link href="/proof">Proof</Link>
        <Link href={profileReturnHref}>Profile</Link>
      </nav>

      <section className="onboarding-hero">
        {NARRATIVE_V1_WIRE_ENABLED ? (
          <figure className="onboarding-hero__forge-photo">
            <Image
              src={narrativeV1Assets.forgeA03HalfBuiltPair}
              alt="Forge beat — two lanes on the plan"
              width={720}
              height={405}
              className="onboarding-hero__photo"
            />
          </figure>
        ) : null}
        <div>
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.onboarding.headline}</h1>
        <p>{copy.onboarding.subhead}</p>
        <p className="muted">
          {isRecommendationJourney
            ? "This free first step saves your lane and location. Next, add one goal or project detail in Profile Builder and return to your private recommendation. Foundry Dues stay optional."
            : "Onboarding is free. After the first weld you can open the member floor, build your profile, or compare Foundry Dues — nothing here requires payment."}
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-outline" href="/formation">
            See formation
          </Link>
          <Link className="button button-outline" href="/spark">
            See spark
          </Link>
        </div>
        </div>
      </section>

      {collectionNotice ? (
        <p className="profile-field-help onboarding-data-notice">
          {collectionNotice} Read the <Link href="/privacy">Public Test Data Notice</Link> before saving.
        </p>
      ) : null}

      {phase === "first-weld" && (
        <section className="ops-card onboarding-panel">
          <form className="first-weld-grid" onSubmit={saveFirstWeld}>
            <label className="field">
              <span>{copy.onboarding.lane}</span>
              <select name="lane" defaultValue="Builder">
                {copy.laneOptions.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{copy.onboarding.arena}</span>
              <input name="arena" placeholder="plumbing, food service, HVAC" required />
            </label>
            <label className="field">
              <span>{copy.onboarding.turf}</span>
              <input name="turf" inputMode="numeric" maxLength={5} placeholder="ZIP code" required />
            </label>
            <button className="button button-light" type="submit" disabled={busy}>
              {isRecommendationJourney ? "Save and continue to profile" : "Set the First Weld"}
            </button>
          </form>
          <p className="status-line" role="status">{status}</p>
        </section>
      )}

      {phase === "doors" && (
        <section className="door-section">
          <div className="card-heading">
            <p>Three doors</p>
            <h2>{copy.onboarding.doorsHeadline}</h2>
          </div>
          <p>
            Pick a profile depth below, jump to the member floor, or compare Foundry Dues when you are ready. Nothing
            here requires payment.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/dashboard">
              Go to member home
            </Link>
            <Link className="button button-outline" href={profileReturnHref}>
              Open profile
            </Link>
            <Link className="button button-outline" href="/membership">
              Compare Foundry Dues
            </Link>
          </div>
          <div className="door-grid">
            <article className="ops-card door-card">
              <h3>{copy.onboarding.doors.quickWeld.title}</h3>
              <p>{copy.onboarding.doors.quickWeld.body}</p>
              <button className="button button-light" type="button" onClick={() => setPhase("quick-weld")}>
                {copy.onboarding.doors.quickWeld.cta}
              </button>
            </article>
            <article className="ops-card door-card">
              <h3>{copy.onboarding.doors.fullAudit.title}</h3>
              <p>{copy.onboarding.doors.fullAudit.body}</p>
              <button className="button button-dark" type="button" onClick={() => chooseDepth("full_audit")}>
                {copy.onboarding.doors.fullAudit.cta}
              </button>
            </article>
            <article className="ops-card door-card">
              <h3>{copy.onboarding.doors.workshop.title}</h3>
              <p>{copy.onboarding.doors.workshop.body}</p>
              <button className="button button-outline" type="button" onClick={() => chooseDepth("blueprint")}>
                {copy.onboarding.doors.workshop.cta}
              </button>
            </article>
          </div>
          <p className="status-line" role="status">{status}</p>
        </section>
      )}

      {phase === "quick-weld" && (
        <section className="ops-card onboarding-panel">
          <div className="card-heading">
            <p>The Quick Weld</p>
            <h2>Five answers. No marble lobby.</h2>
          </div>
          <form className="profile-grid" onSubmit={saveQuickWeld}>
            <label className="field wide-field">
              <span>Skills offered</span>
              <input name="skills_offered" placeholder="field work, books, dispatch" required />
            </label>
            <label className="field wide-field">
              <span>Skills sought</span>
              <input name="skills_sought" placeholder="license, crews, sales" required />
            </label>
            <label className="field">
              <span>Timeline</span>
              <input name="timeline_to_launch" placeholder="0-3 months" required />
            </label>
            <label className="field">
              <span>Primary goal</span>
              <input name="primary_goal" placeholder="Durable local company" required />
            </label>
            <label className="field">
              <span>Work preference</span>
              <select name="work_preference" defaultValue="Local Only">
                {copy.workPreferences.map((preference) => (
                  <option key={preference}>{preference}</option>
                ))}
              </select>
            </label>
            <div className="profile-actions">
              <button className="button button-light" type="submit" disabled={busy}>
                Save Quick Weld
              </button>
              <p className="status-line" role="status">{status}</p>
            </div>
          </form>
        </section>
      )}

      {phase === "blueprint" && (
        <section className="ops-card onboarding-panel">
          <div className="card-heading">
            <p>The Workshop</p>
            <h2>Tell the machine what wants to exist.</h2>
          </div>
          <form className="form-stack" onSubmit={saveBlueprint}>
            <label className="field">
              <span>Workshop narrative</span>
              <textarea
                name="blueprint_narrative"
                rows={8}
                placeholder="What are you building, who is missing, what proof do you already have, and where does this thing live?"
                required
              />
            </label>
            <button className="button button-light" type="submit" disabled={busy}>
              Save Workshop
            </button>
            <p className="status-line" role="status">{status}</p>
          </form>
        </section>
      )}
    </main>
    <PublicTrustFooter />
    </>
  );
}
