"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { MemberDataCustodyMap } from "@/components/profile/member-data-custody-map";
import { copy } from "@/lib/copy";
import { deriveAccessWeight } from "@/lib/access-weight-client";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type ProfileRow = {
  display_name?: string;
  first_name?: string;
  last_name?: string;
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

function splitTags(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinTags(value?: string[]) {
  return (value || []).join(", ");
}

function profileDepthLabel(profile: ProfileRow) {
  const weight = deriveAccessWeight(profile);
  if (weight === "heavyweight") return "Verified details";
  if (weight === "middleweight") return "More details";
  return "Basic";
}

function checkStatusLabel(value?: string | null) {
  if (!value || value === "none") return "Not started";
  return value.replaceAll("_", " ");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow>({});
  const [status, setStatus] = useState("Loading profile...");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      let supabase: ReturnType<typeof getSupabaseBrowser>;

      try {
        supabase = getSupabaseBrowser();
      } catch {
        setStatus("Profile saving is temporarily unavailable. Nothing on this page was sent or changed.");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setStatus("Log in before creating a production profile.");
        return;
      }

      setEmail(userData.user.email || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (error) {
        setStatus(error.message);
        return;
      }

      setProfile(data || {});
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
      setStatus("Profile saving is temporarily unavailable. Your edits remain on this page and were not sent.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setStatus("Log in before saving.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const row = {
      id: userData.user.id,
      email: userData.user.email,
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
    setStatus(error ? error.message : "Profile saved.");
  }

  return (
    <CockpitShell>
      <main className="dashboard-main profile-page">
      <section className="profile-member-hero" aria-labelledby="profile-page-title">
        <div className="profile-member-hero__copy">
          <p className="profile-member-hero__eyebrow">Your member card</p>
          <h1 id="profile-page-title">Who you are—and what you want to build.</h1>
          <p>
            Give Werkles enough context to find useful work, people, and next moves. You can change it whenever your
            plans change.
          </p>
          <div className="profile-member-hero__status" aria-label="Profile status">
            <span><strong>{profileDepthLabel(profile)}</strong> profile</span>
            <span><strong>{profile.membership_tier || "Free"}</strong> membership</span>
            <span><strong>{profile.location_city || "Location"}</strong>{profile.location_state ? `, ${profile.location_state}` : " not added"}</span>
          </div>
        </div>
        <figure className="profile-member-hero__visual">
          <Image
            src="/assets/draft/people-v1/people-spark-idea-moment.jpg"
            alt="A business owner shaping an idea at a worktable"
            width={1536}
            height={1024}
            sizes="(max-width: 820px) 100vw, 42vw"
            priority
          />
          <figcaption>Your profile should sound like a person, not an application file.</figcaption>
        </figure>
      </section>

      <section className="ops-card profile-editor" id="profile-form">
        <div className="card-heading">
          <p>Who you are</p>
          <h2>Build the profile people will meet.</h2>
        </div>
        {/* Owner walkthrough 2026-07-27: the profile felt like a form to
           survive. Same fields, same save — regrouped into three short
           stages so autofill facts and reflective questions stop
           interleaving. */}
        <form className="profile-form-staged" key={`${email || "anonymous"}:${profile.display_name || "new"}`} onSubmit={handleSubmit}>
          <details className="profile-stage" open>
            <summary>
              <span className="profile-stage__num">1</span> The facts
              <small>Name, contact, location — the autofill stuff. One pass, done.</small>
            </summary>
            <div className="profile-grid">
              <label className="field">
                <span>Display name</span>
                <input name="display_name" defaultValue={profile.display_name || ""} required />
              </label>
              <label className="field">
                <span>First name</span>
                <input name="first_name" defaultValue={profile.first_name || ""} autoComplete="given-name" />
              </label>
              <label className="field">
                <span>Last name</span>
                <input name="last_name" defaultValue={profile.last_name || ""} autoComplete="family-name" />
              </label>
              <label className="field">
                <span>Email</span>
                <input value={email || ""} readOnly />
              </label>
              <label className="field">
                <span>Phone</span>
                <input name="phone" type="tel" autoComplete="tel" placeholder="Optional" />
              </label>
              <label className="consent-line">
                <input name="phone_consent" type="checkbox" />
                <span>{copy.auth.phoneConsent}</span>
              </label>
              <label className="field">
                <span>City</span>
                <input name="location_city" defaultValue={profile.location_city || ""} autoComplete="address-level2" required />
              </label>
              <label className="field">
                <span>State</span>
                <input name="location_state" defaultValue={profile.location_state || ""} maxLength={2} autoComplete="address-level1" required />
              </label>
              <label className="field">
                <span>ZIP code</span>
                <input name="turf_zip" defaultValue={profile.turf_zip || ""} inputMode="numeric" maxLength={5} autoComplete="postal-code" />
              </label>
              <label className="field">
                <span>Current employer</span>
                <input name="current_employer" defaultValue={profile.current_employer || ""} autoComplete="organization" />
              </label>
              <label className="consent-line">
                <input name="show_employer" type="checkbox" defaultChecked={Boolean(profile.show_employer)} />
                <span>Show employer on public profile</span>
              </label>
              <label className="field">
                <span>Visibility</span>
                <select name="visibility_mode" defaultValue={profile.visibility_mode || "full_name"}>
                  {copy.visibilityModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </label>
            </div>
          </details>

          <details className="profile-stage">
            <summary>
              <span className="profile-stage__num">2</span> Your work
              <small>Pick from lists — what you do and what you're looking for.</small>
            </summary>
            <div className="profile-grid">
              <label className="field">
                <span>Role you want to play</span>
                <select name="lane" defaultValue={profile.lane || "Builder"}>
                  {copy.laneOptions.map((lane) => <option key={lane}>{lane}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Work preference</span>
                <select name="work_preference" defaultValue={profile.work_preference || "Local Only"}>
                  {copy.workPreferences.map((preference) => <option key={preference}>{preference}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{copy.dashboard.profile.depthLabel}</span>
                <select name="profile_depth" defaultValue={profile.profile_depth || "quick_weld"}>
                  <option value="quick_weld">Quick profile</option>
                  <option value="full_audit">Detailed profile</option>
                  <option value="blueprint">Business plan</option>
                </select>
              </label>
              <label className="field wide-field">
                <span>Skills offered</span>
                <input name="skills_offered" defaultValue={joinTags(profile.skills_offered)} placeholder="field, sales, books" />
              </label>
              <label className="field wide-field">
                <span>Skills sought</span>
                <input name="skills_sought" defaultValue={joinTags(profile.skills_sought)} placeholder="capital, license, admin" />
              </label>
              <label className="field wide-field">
                <span>Industry tags</span>
                <input name="industry_tags" defaultValue={joinTags(profile.industry_tags)} placeholder="plumbing, home services" />
              </label>
            </div>
          </details>

          <details className="profile-stage">
            <summary>
              <span className="profile-stage__num">3</span> Your story
              <small>The thinking questions — take your time, or come back later.</small>
            </summary>
            <div className="profile-grid">
              {/* Guided choices plus custom entry (owner walkthrough) — a
                 datalist keeps free text while offering real options. */}
              <label className="field">
                <span>Timeline</span>
                <input
                  name="timeline_to_launch"
                  defaultValue={profile.timeline_to_launch || ""}
                  list="timeline-options"
                  placeholder="Pick or type your own"
                />
                <datalist id="timeline-options">
                  <option value="Already operating" />
                  <option value="0-3 months" />
                  <option value="3-6 months" />
                  <option value="6-12 months" />
                  <option value="1-2 years" />
                  <option value="Exploring, no date yet" />
                </datalist>
              </label>
              <label className="field">
                <span>Primary goal</span>
                <input
                  name="primary_goal"
                  defaultValue={profile.primary_goal || ""}
                  list="goal-options"
                  placeholder="Pick or type your own"
                />
                <datalist id="goal-options">
                  <option value="First customer" />
                  <option value="First sale" />
                  <option value="Opening day" />
                  <option value="Steady income replacing my job" />
                  <option value="Generational family business" />
                  <option value="Grow an existing business" />
                  <option value="Find the right partner" />
                </datalist>
              </label>
              <label className="field wide-field">
                <span>What you are building</span>
                <textarea
                  name="blueprint_narrative"
                  defaultValue={profile.blueprint_narrative || ""}
                  rows={5}
                  placeholder="What are you building, who is missing, and where does this thing live?"
                />
              </label>
            </div>
          </details>

          <div className="profile-actions">
            <button className="button button-dark" type="submit">Save profile</button>
            <p className="status-line" role="status">{status}</p>
          </div>
        </form>
      </section>

      <section className="ops-card profile-proof-overview" aria-labelledby="profile-proof-title">
        <div className="card-heading">
          <p>Prove it</p>
          <h2 id="profile-proof-title">Add a check only when a decision needs one.</h2>
        </div>
        <p className="profile-proof-overview__lead">
          A check confirms one narrow fact. It does not rank your worth, reveal your balance to the community, or make
          every profile claim true.
        </p>
        <div className="profile-proof-overview__grid">
          <article>
            <span>Identity</span>
            <strong>{checkStatusLabel(profile.id_status)}</strong>
            <p>Confirms that a real person completed the identity step.</p>
            <Link href="/dashboard/crucible#check-identity">Review identity check →</Link>
          </article>
          <article>
            <span>Phone</span>
            <strong>Not started</strong>
            <p>Confirms control of a phone number without publishing it.</p>
            <Link href="/dashboard/crucible#check-phone">Review phone check →</Link>
          </article>
          <article>
            <span>Funds</span>
            <strong>{checkStatusLabel(profile.funds_status)}</strong>
            <p>Can confirm a threshold and date—not display or rank account balances.</p>
            <Link href="/dashboard/crucible#check-funds">Review funds check →</Link>
          </article>
          <article>
            <span>Claim review</span>
            <strong>{checkStatusLabel(profile.deep_audit_status)}</strong>
            <p>For a specific claim that needs human review. This is not available yet.</p>
            <span className="profile-proof-overview__unavailable">Coming later</span>
          </article>
        </div>
        <div className="profile-proof-overview__actions">
          <Link className="button button-outline" href="/dashboard/crucible">
            Open detailed checks
          </Link>
          <Link className="button button-outline" href="/proof">
            How checks work
          </Link>
        </div>
      </section>

      <details className="profile-custody-disclosure">
        <summary>Where this information saves</summary>
        <MemberDataCustodyMap />
      </details>
      </main>
    </CockpitShell>
  );
}
