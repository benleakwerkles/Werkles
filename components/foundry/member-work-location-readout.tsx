"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  memberWorkLocation,
  WERKLE_OPERATING_BRIEF_CHANGE_EVENT,
  type MemberWorkSurface
} from "@/lib/member-work-location";
import {
  storedWerkleOperatingBriefFrom,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY
} from "@/lib/werkle/operating-brief-device";

function hasCurrentBrief(formationId: string | undefined) {
  if (!formationId) return false;
  try {
    const raw = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
    if (!raw) return false;
    const stored = storedWerkleOperatingBriefFrom(JSON.parse(raw));
    return stored?.brief.formationId === formationId;
  } catch {
    window.localStorage.removeItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
    return false;
  }
}

export function MemberWorkLocationReadout({
  surface,
  formationId
}: {
  surface: MemberWorkSurface;
  formationId?: string;
}) {
  const [currentBrief, setCurrentBrief] = useState(false);

  useEffect(() => {
    if (surface !== "formation") return;
    const refresh = () => setCurrentBrief(hasCurrentBrief(formationId));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(WERKLE_OPERATING_BRIEF_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(WERKLE_OPERATING_BRIEF_CHANGE_EVENT, refresh);
    };
  }, [formationId, surface]);

  const location = memberWorkLocation(surface, currentBrief);

  return (
    <aside className="member-work-location" data-work-location={location.id} aria-labelledby={`work-location-${surface}`}>
      <div>
        <p className="eyebrow">Where this work lives</p>
        <h2 id={`work-location-${surface}`}>{location.stage}</h2>
        <p>{location.next}</p>
        <small>This tells you which room you are in. It does not mean another person responded, agreed, paid, or joined a company.</small>
      </div>
      <Link className="button button-dark" href={location.href}>{location.action}</Link>
    </aside>
  );
}

