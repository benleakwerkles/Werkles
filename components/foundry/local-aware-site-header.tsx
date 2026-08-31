import { cookies } from "next/headers";

import { shouldUseRuntimePreviewAuth } from "@/lib/dev-preview-auth";
import { isLocalWalkthroughSessionCookie } from "@/lib/local-walkthrough-header";

import { SiteHeader } from "./site-header";

const DEV_PREVIEW_COOKIE = "werkles_dev_preview_session";

export async function LocalAwareSiteHeader() {
  const localWalkthrough = shouldUseRuntimePreviewAuth()
    && isLocalWalkthroughSessionCookie((await cookies()).get(DEV_PREVIEW_COOKIE)?.value);

  return <SiteHeader localWalkthrough={localWalkthrough} />;
}
