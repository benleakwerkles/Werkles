"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { deriveAccessWeight } from "@/lib/access-weight-client";
import {
  PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE,
  PUBLIC_TEST_PROVIDER_ACTIONS_OPEN
} from "@/lib/app-infra-preview";
import {
  PRIMARY_GOAL_SUGGESTIONS,
  PROFILE_LANE_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  US_STATE_OPTIONS
} from "@/lib/profile-builder-options";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { hasUsableMemberProfileSignal } from "@/lib/matching/signals";
import { safeMemberReturnPath } from "@/lib/safe-member-return";

type ProfileRow = {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  location_city?: string;
  location_state?: string;
  lane?: string;
  work_preference?: string;
  current_employer?: string;
  skills_offered?: string[];
  skills_sought?: string[];
  industry_tags?: string[];
  timeline_to_launch?: string;
  primary_goal?: string;
  visibility_mode?: string;
  show_employer?: boolean;
  profile_depth?: string;
  membership_tier?: string;
  subscription_status?: string;
  id_status?: string;
  funds_status?: string;
  deep_audit_status?: string;
  turf_zip?: string;
  blueprint_narrative?: string;
};

type ProfileAuthState = "checking" | "signed_out" | "signed_in" | "unavailable";

const recommendationSignalGuidance =
  "Add one Primary goal, Blueprint narrative, or Skills sought entry to unlock your private recommendation.";

function splitTags(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinTags(value?: string[]) {
  return (value || []).join(", ");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow>({});
  const [status, setStatus] = useState("Loading profile...");
  const [verificationStatus, setVerificationStatus] = useState(copy.verification.pending);
  const [email, setEmail] = useState<string | null>(null);
  const [recommendationReady, setRecommendationReady] = useState(false);
  const [recommendationReturnPath, setRecommendationReturnPath] = useState("/bellows/recommendations");
  const [isRecommendationJourney, setIsRecommendationJourney] = useState(false);
  const [profileAuthState, setProfileAuthState] = useState<ProfileAuthState>("checking");

  useEffect(() => {
    async function loadProfile() {
      const params = new URLSearchParams(window.location.search);
      setIsRecommendationJourney(params.get("next") === "/bellows/recommendations");
      setRecommendationReturnPath(
        safeMemberReturnPath(params.get("next"), "/bellows/recommendations")
      );
      let supabase: ReturnType<typeof getSupabaseBrowser>;

      try {
        supabase = getSupabaseBrowser();
      } catch {
        setProfileAuthState("unavailable");
        setStatus("Profile Builder could not connect. Try again shortly.");
        return;
      }

      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        setProfileAuthState("unavailable");
        setStatus("Profile Builder could not confirm your account. Try signing in again.");
        return;
      }

      if (!userData.user) {
        setProfileAuthState("signed_out");
        setStatus("Sign in or create an account to build your production profile.");
        return;
      }

      setEmail(userData.user.email || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (error) {
        setProfileAuthState("signed_in");
        setStatus("Your profile could not be loaded. Try again.");
        return;
      }

      const loadedProfile = data || {};
      setProfile(loadedProfile);
      setRecommendationReady(hasUsableMemberProfileSignal(loadedProfile));
      setProfileAuthState("signed_in");
      setStatus(data ? "Profile loaded." : "Create your first production profile.");
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let supabase: ReturnType<typeof getSupabaseBrowser>;

    try {
      supabase = getSupabaseBrowser();
    } catch {
      setStatus("Profile Builder could not connect. Try again shortly.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setProfileAuthState("signed_out");
      setStatus("Log in before saving.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const row = {
      id: userData.user.id,
      email: String(form.get("contact_email") || "").trim() || userData.user.email || null,
      display_name: String(form.get("display_name") || "").trim(),
      first_name: String(form.get("first_name") || "").trim() || null,
      last_name: String(form.get("last_name") || "").trim() || null,
      location_city: String(form.get("location_city") || "").trim(),
      location_state: String(form.get("location_state") || "").trim().toUpperCase(),
      lane: String(form.get("lane") || "Builder"),
      work_preference: String(form.get("work_preference") || "Local Only"),
      current_employer: String(form.get("current_employer") || "").trim() || null,
      phone:
        form.get("phone_consent") === "on"
          ? String(form.get("phone") || "").trim() || null
          : null,
      past_roles: [],
      skills_offered: splitTags(form.get("skills_offered")),
      skills_sought: splitTags(form.get("skills_sought")),
      industry_tags: splitTags(form.get("industry_tags")),
      timeline_to_launch: String(form.get("timeline_to_launch") || "").trim() || null,
      primary_goal: String(form.get("primary_goal") || "").trim() || null,
      profile_depth: String(form.get("profile_depth") || "quick_weld"),
      turf_zip: String(form.get("turf_zip") || "").trim() || null,
      blueprint_narrative: String(form.get("blueprint_narrative") || "").trim() || null,
      visibility_mode: String(form.get("visibility_mode") || "full_name"),
      show_employer: form.get("show_employer") === "on"
    };

    if (!row.display_name || !row.location_city || !row.location_state) {
      setStatus("Display name, city, and state are required.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert(row);
    if (error) {
      setStatus("Profile could not be saved. Try again.");
      return;
    }

    const isRecommendationReady = hasUsableMemberProfileSignal(row);
    setRecommendationReady(isRecommendationReady);
    setStatus(
      isRecommendationReady
        ? "Profile saved. Your private recommendation is ready."
        : `Profile saved. ${recommendationSignalGuidance}`
    );

    if (isRecommendationJourney && isRecommendationReady) {
      window.location.assign(recommendationReturnPath);
    }
  }

  async function triggerVerification(kind: "identity" | "funds") {
    let supabase: ReturnType<typeof getSupabaseBrowser>;

    try {
      supabase = getSupabaseBrowser();
    } catch (error) {
      setVerificationStatus(error instanceof Error ? error.message : "The steel is not connected yet.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setVerificationStatus("Log in before preparing verification.");
      return;
    }

    setVerificationStatus(copy.verification.pending);
    const response = await fetch(`/api/verification/${kind}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const payload = await response.json();
    setVerificationStatus(payload.error || payload.label || copy.verification.prepared);
  }

  const encodedRecommendationReturnPath = encodeURIComponent(recommendationReturnPath);
  const displayNameField = (
    <label className="field">
      <span>Display name</span>
      <input name="display_name" defaultValue={profile.display_name || ""} required />
    </label>
  );
  const cityField = (
    <label className="field">
      <span>City</span>
      <input name="location_city" defaultValue={profile.location_city || ""} required />
    </label>
  );
  const stateField = (
    <label className="field">
      <span>State or territory</span>
      <select name="location_state" defaultValue={profile.location_state || ""} required>
        <option value="" disabled>Choose a state or territory</option>
        {US_STATE_OPTIONS.map(([code, label]) => (
          <option key={code} value={code}>{label} ({code})</option>
        ))}
      </select>
    </label>
  );
  const recommendationBaseFields = (
    <>
      {profile.display_name ? (
        <input type="hidden" name="display_name" value={profile.display_name} />
      ) : displayNameField}
      {profile.location_city ? (
        <input type="hidden" name="location_city" value={profile.location_city} />
      ) : cityField}
      {profile.location_state ? (
        <input type="hidden" name="location_state" value={profile.location_state} />
      ) : stateField}
    </>
  );
  const primaryGoalField = (
    <label className="field">
      <span>Primary goal</span>
      <input
        name="primary_goal"
        list="primaryGoalSuggestions"
        defaultValue={profile.primary_goal || ""}
        placeholder="Choose an idea or type your own"
        aria-describedby="primaryGoalHelp"
      />
      <datalist id="primaryGoalSuggestions">
        {PRIMARY_GOAL_SUGGESTIONS.map((goal) => <option key={goal} value={goal} />)}
      </datalist>
      <small className="profile-field-help" id="primaryGoalHelp">
        Pick a suggestion or write a goal in your own words.
      </small>
    </label>
  );
  const skillsSoughtField = (
    <label className="field wide-field">
      <span>Skills sought</span>
      <input name="skills_sought" defaultValue={joinTags(profile.skills_sought)} placeholder="capital, license, admin" />
    </label>
  );
  const blueprintNarrativeField = (
    <label className="field wide-field">
      <span>Blueprint narrative</span>
      <textarea
        name="blueprint_narrative"
        defaultValue={profile.blueprint_narrative || ""}
        rows={5}
        placeholder="What are you building, who is missing, and where does this thing live?"
      />
    </label>
  );

  return (
    <CockpitShell>
      <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
        <Link href="/dashboard/intros">Intros</Link>
      </nav>

      {profileAuthState === "checking" || profileAuthState === "unavailable" ? (
        <section className="ops-card" aria-labelledby="profileAuthStatusTitle">
          <div className="card-heading">
            <p>Profile Builder</p>
            <h1 id="profileAuthStatusTitle">
              {profileAuthState === "checking" ? "Checking your account…" : "Profile Builder is unavailable."}
            </h1>
          </div>
          <p className="status-line" role={profileAuthState === "unavailable" ? "alert" : "status"}>{status}</p>
        </section>
      ) : null}

      {profileAuthState === "signed_out" ? (
        <section className="ops-card" aria-labelledby="profileSignInTitle">
          <div className="card-heading">
            <p>Profile Builder</p>
            <h1 id="profileSignInTitle">Sign in before adding profile details.</h1>
          </div>
          <p>Your profile stays attached to your account. We will return you to the recommendation you came for.</p>
          <div className="profile-actions">
            <Link className="button button-dark" href={`/signup?next=${encodedRecommendationReturnPath}`}>
              Create account
            </Link>
            <Link className="button button-outline" href={`/login?next=${encodedRecommendationReturnPath}`}>
              Sign in
            </Link>
            <p className="status-line" role="status">{status}</p>
          </div>
        </section>
      ) : null}

      {profileAuthState === "signed_in" ? (
      <section className="ops-card profile-editor">
        <div className="profile-builder-intro">
          <div className="profile-builder-intro__copy">
            <div className="card-heading">
              <p>{copy.dashboard.profile.kicker}</p>
              <h1>{copy.dashboard.profile.headline}</h1>
            </div>
            <p>
              Give Werkles enough signal to understand what you are building, what you can carry, and what is missing.
              You can keep the specifics plain and human.
            </p>
          </div>
          <figure className="profile-builder-intro__media">
            <Image
              src="/assets/draft/render-batch-1/werkles-render-batch-1-electrician-bookkeeper.png"
              width={1536}
              height={1024}
              sizes="(max-width: 820px) 100vw, 38vw"
              alt="An electrician and a bookkeeper reviewing a business plan together in a workshop"
              priority
            />
            <figcaption>A useful profile makes the missing piece easier to see.</figcaption>
          </figure>
        </div>
        <div className="trust-state-strip" aria-label="Trust state">
          <span>{deriveAccessWeight(profile)} Foundry record</span>
          <span>Membership: {profile.membership_tier || "free"}</span>
          <span>ID: {profile.id_status || "none"}</span>
          <span>Assets: {profile.funds_status || "none"}</span>
        </div>
        <form className="profile-grid" key={`${email || "anonymous"}:${profile.display_name || "new"}`} onSubmit={handleSubmit}>
          {isRecommendationJourney ? (
            <>
              <p className="profile-field-help wide-field" role="note">
                Start with one useful signal. If this profile is new, add the basic name and location fields shown here
                too. Then we will open your private recommendation; you can finish the rest later.
              </p>
              {recommendationBaseFields}
              {primaryGoalField}
              {skillsSoughtField}
              {blueprintNarrativeField}
              <div className="profile-actions wide-field recommendation-activation-actions">
                {recommendationReady ? (
                  <>
                    <button className="button button-dark" type="submit">
                      Save changes and refresh recommendation
                    </button>
                    <Link className="button button-outline" href={recommendationReturnPath}>
                      See current saved recommendation
                    </Link>
                  </>
                ) : (
                  <button className="button button-dark" type="submit">Save and see my recommendation</button>
                )}
                <p className="profile-field-help">
                  {recommendationReady
                    ? "Your profile has enough detail for a private recommendation."
                    : recommendationSignalGuidance}
                </p>
                <p className="status-line" role="status">{status}</p>
              </div>
            </>
          ) : null}
          <p className="profile-field-help wide-field">
            This form saves details to your signed-in account. Read the{" "}
            <Link href="/privacy">Public Test Data Notice</Link> before adding anything you do not want in your profile.
          </p>
          {!isRecommendationJourney ? displayNameField : null}
          <label className="field">
            <span>First name</span>
            <input name="first_name" defaultValue={profile.first_name || ""} />
          </label>
          <label className="field">
            <span>Last name</span>
            <input name="last_name" defaultValue={profile.last_name || ""} />
          </label>
          <label className="field">
            <span>Account email</span>
            <input type="email" value={email || ""} readOnly aria-describedby="accountEmailHelp" />
            <small className="profile-field-help" id="accountEmailHelp">
              Used to sign in. Your preferred contact email can be different.
            </small>
          </label>
          <label className="field">
            <span>Preferred contact email (optional)</span>
            <input
              name="contact_email"
              type="email"
              autoComplete="email"
              defaultValue={profile.email && profile.email.toLowerCase() !== email?.toLowerCase() ? profile.email : ""}
              placeholder="another@email.com"
              aria-describedby="contactEmailHelp"
            />
            <small className="profile-field-help" id="contactEmailHelp">
              Use another inbox for Werkles contact. This is not shown on your public profile.
            </small>
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="phone" type="tel" placeholder="Twilio Verify wiring next" />
          </label>
          <label className="consent-line">
            <input name="phone_consent" type="checkbox" />
            <span>{copy.auth.phoneConsent}</span>
          </label>
          {!isRecommendationJourney ? cityField : null}
          {!isRecommendationJourney ? stateField : null}
          <label className="field">
            <span>Turf ZIP</span>
            <input name="turf_zip" defaultValue={profile.turf_zip || ""} inputMode="numeric" maxLength={5} />
          </label>
          <label className="field">
            <span>Lane (broad role)</span>
            <select name="lane" defaultValue={profile.lane || "Builder"}>
              {PROFILE_LANE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <small className="profile-field-help">
              Lanes route matching; they are not job titles. Put your specific niche in skills and your blueprint.
            </small>
          </label>
          <label className="field">
            <span>Work preference</span>
            <select name="work_preference" defaultValue={profile.work_preference || "Local Only"}>
              {copy.workPreferences.map((preference) => <option key={preference}>{preference}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Current employer</span>
            <input name="current_employer" defaultValue={profile.current_employer || ""} />
          </label>
          <label className="consent-line">
            <input name="show_employer" type="checkbox" defaultChecked={Boolean(profile.show_employer)} />
            <span>Show employer on public profile</span>
          </label>
          <label className="field">
            <span>Visibility</span>
            <select name="visibility_mode" defaultValue={profile.visibility_mode || "full_name"}>
              {PROFILE_VISIBILITY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{copy.dashboard.profile.depthLabel}</span>
            <select name="profile_depth" defaultValue={profile.profile_depth || "quick_weld"}>
              <option value="quick_weld">Quick Weld</option>
              <option value="full_audit">Full Audit</option>
              <option value="blueprint">Blueprint</option>
            </select>
          </label>
          <label className="field">
            <span>Timeline</span>
            <input name="timeline_to_launch" defaultValue={profile.timeline_to_launch || ""} placeholder="0-3 months" />
          </label>
          {!isRecommendationJourney ? primaryGoalField : null}
          <label className="field wide-field">
            <span>Skills offered</span>
            <input name="skills_offered" defaultValue={joinTags(profile.skills_offered)} placeholder="field, sales, books" />
          </label>
          {!isRecommendationJourney ? skillsSoughtField : null}
          <label className="field wide-field">
            <span>Industry tags</span>
            <input name="industry_tags" defaultValue={joinTags(profile.industry_tags)} placeholder="plumbing, home services" />
          </label>
          {!isRecommendationJourney ? blueprintNarrativeField : null}
          <div className="profile-actions">
            {isRecommendationJourney ? (
              <button className="button button-outline" type="submit">Save remaining profile details</button>
            ) : (
              <>
                <button className="button button-dark" type="submit">Save profile</button>
                {recommendationReady ? (
                  <Link className="button button-outline" href={recommendationReturnPath}>
                    See my private recommendation
                  </Link>
                ) : null}
              </>
            )}
            {!isRecommendationJourney ? (
              <>
                <p className="profile-field-help">
                  {recommendationReady
                    ? "Your profile has enough detail for a private recommendation."
                    : recommendationSignalGuidance}
                </p>
                <p className="status-line" role="status">{status}</p>
              </>
            ) : null}
          </div>
        </form>
      </section>
      ) : null}

      {profileAuthState === "signed_in" ? (
      <>
      <section className="ops-card" aria-label="Member floor map">
        <div className="card-heading">
          <p>Member floor</p>
          <h2>Profile is the anchor. Everything else hangs off it.</h2>
        </div>
        <p>
          Save lane, turf, and skills here first. Then use the member surfaces to move work forward — intros, checks, and
          proof stay separate from profile depth.
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-outline" href="/dashboard">
            Member home
          </Link>
          <Link className="button button-outline" href="/dashboard/intros">
            Intros
          </Link>
          <Link className="button button-outline" href="/dashboard/crucible">
            Crucible checks
          </Link>
          <Link className="button button-outline" href="/proof">
            Proof doctrine
          </Link>
        </div>
      </section>

      <section className="ops-card verification-card">
        <div className="card-heading">
          <p>Verification Gates</p>
          <h2>{copy.dashboard.profile.verificationHeadline}</h2>
        </div>
        <p>{copy.dashboard.profile.verificationBody}</p>
        <p className="muted">
          {PUBLIC_TEST_PROVIDER_ACTIONS_OPEN
            ? "Verification is optional and separate from Foundry Dues."
            : `${PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE} No provider session will start and no verification status will change.`}
        </p>
        <div className="verification-actions">
          {PUBLIC_TEST_PROVIDER_ACTIONS_OPEN ? (
            <>
              <button className="button button-outline" type="button" onClick={() => triggerVerification("identity")}>
                Prepare ID Check
              </button>
              <button className="button button-outline" type="button" onClick={() => triggerVerification("funds")}>
                Prepare Asset Check
              </button>
            </>
          ) : (
            <>
              <button className="button button-outline" type="button" disabled>
                ID Check — closed
              </button>
              <button className="button button-outline" type="button" disabled>
                Asset Check — closed
              </button>
            </>
          )}
        </div>
        <p className="status-line" role="status">
          {PUBLIC_TEST_PROVIDER_ACTIONS_OPEN ? verificationStatus : PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE}
        </p>
      </section>

      <section className="ops-card deep-audit-card">
        <div className="card-heading">
          <p>{copy.deepAudit.title}</p>
          <h2>Manual review for claims that need more weight.</h2>
        </div>
        <p>{copy.deepAudit.body}</p>
        <button className="button button-light deep-audit-button" type="button" disabled>
          {copy.deepAudit.cta}
        </button>
        <p className="status-line">
          Status: {profile.deep_audit_status || "none"}. {copy.deepAudit.placeholder}
        </p>
      </section>
      </>
      ) : null}
      </main>
    </CockpitShell>
  );
}
