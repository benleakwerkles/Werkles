import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { isRuntimeRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { MemberDashboardClient } from "./member-dashboard-client";

const COOKIE_KEY = "werkles_dev_preview_session";

function readPreviewCookie(raw: string | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email?: string; userId?: string };
    if (!parsed.email || !parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const previewSession = readPreviewCookie((await cookies()).get(COOKIE_KEY)?.value);
  if (isRuntimeRoutePreviewUnlocked() && !previewSession) {
    redirect("/login?next=/dashboard");
  }

  return (
    <CockpitShell showDraftBadge={false}>
      <main className={`dashboard-main ${routeAtmosphere.dashboard}`}>
        <MemberDashboardClient initialSignedIn={Boolean(previewSession)} initialEmail={previewSession?.email ?? null} />
      </main>
    </CockpitShell>
  );
}
