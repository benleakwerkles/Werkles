"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { GhostMemberInteractionLab } from "@/components/ghost-fleet/ghost-member-interaction-lab";
import { getClientAccessToken } from "@/lib/client-auth";
import type { GhostInteractionMember } from "@/lib/ghost-fleet/interaction";

type AccountGhostResponse = Readonly<{
  needsIntake?: boolean;
  members?: readonly GhostInteractionMember[];
  location?: Readonly<{ city: string; state: string; workPreference: string }> | null;
  locationMessage?: string;
}>;

export function AccountAwareGhostMemberLab({
  initialMembers
}: {
  initialMembers: readonly GhostInteractionMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [loadState, setLoadState] = useState<"checking" | "ready" | "account_error">("checking");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [needsIntake, setNeedsIntake] = useState(false);
  const [localWalkthrough, setLocalWalkthrough] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!active) return;
      if (!token) {
        setLoadState("ready");
        return;
      }
      const local = token === "dev-preview-token";
      const response = await fetch(local ? "/api/ghost-fleet/intros/preference" : "/api/ghost-fleet/intros/current", {
        headers: local ? undefined : { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) {
        if (!local) {
          setMembers([]);
          setLoadState("account_error");
        } else {
          setLoadState("ready");
        }
        return;
      }
      const result = await response.json().catch(() => ({})) as AccountGhostResponse;
      setNeedsIntake(result.needsIntake === true);
      if (Array.isArray(result.members)) setMembers(result.members);
      if (result.locationMessage) setLocationMessage(result.locationMessage);
      else if (result.location) setLocationMessage(`Using ${result.location.city}, ${result.location.state} for travel fit.`);
      setProfileMissing(!result.location);
      setLocalWalkthrough(local);
      setLoadState("ready");
    })().catch(() => {
      if (active) {
        setMembers([]);
        setLoadState("account_error");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loadState === "checking") {
    return <p className="recview__location-note" aria-live="polite" aria-busy="true">Checking for people tied to your latest Intake.</p>;
  }

  if (loadState === "account_error") {
    return (
      <section className="ops-card" role="alert">
        <h2>Your account shortlist did not load.</h2>
        <p>Werkles will not substitute practice matches from another browser session.</p>
        <Link className="button button-dark" href="/bellows/intake">Check my saved Intake</Link>
      </section>
    );
  }

  if (!members.length) {
    return (
      <section className="ops-card" aria-labelledby="people-empty-title">
        <h2 id="people-empty-title">{needsIntake ? "Complete Intake before Werkles builds your Match Deck." : "No people have a strong enough reason to appear yet."}</h2>
        <p>{needsIntake
          ? "Werkles needs to know what you are building, what is stuck, and what you can offer before it can suggest people intelligently."
          : "Update your Intake or profile location; Werkles will not pad the list."}</p>
        <Link className="button button-dark" href="/bellows/intake">{needsIntake ? "Start Intake" : "Update my Intake"}</Link>
      </section>
    );
  }

  async function saveLocalPreference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/ghost-fleet/intros/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: String(form.get("city") || ""),
          state: String(form.get("state") || ""),
          workPreference: String(form.get("workPreference") || "Local Only")
        })
      });
      const result = await response.json().catch(() => ({})) as AccountGhostResponse & { error?: string };
      if (!response.ok) {
        setLocationMessage(result.error || "Werkles could not save that location.");
        return;
      }
      if (result.members?.length) setMembers(result.members);
      if (result.location) {
        setLocationMessage(`Using ${result.location.city}, ${result.location.state} for travel fit.`);
        setProfileMissing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {locationMessage ? (
        <p className="recview__location-note" role="status">
          {locationMessage}{" "}
          {profileMissing ? <Link href="/dashboard/profile#profile-form">Add it to my profile</Link> : null}
        </p>
      ) : null}
      {localWalkthrough && profileMissing ? (
        <form className="recview__location-form" onSubmit={saveLocalPreference}>
          <p><strong>How close should these people be?</strong> Add this once; you do not need to redo Intake.</p>
          <label>City <input name="city" autoComplete="address-level2" required /></label>
          <label>State <input name="state" autoComplete="address-level1" maxLength={2} required /></label>
          <label>Work style
            <select name="workPreference" defaultValue="Local Only">
              <option>Local Only</option>
              <option>Open to Travel</option>
              <option>Remote Only</option>
              <option>Willing to Relocate</option>
            </select>
          </label>
          <button className="button button-dark" type="submit" disabled={saving}>
            {saving ? "Updating…" : "Update people"}
          </button>
        </form>
      ) : null}
      <GhostMemberInteractionLab members={members} />
    </>
  );
}
