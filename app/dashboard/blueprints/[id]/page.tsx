import { notFound } from "next/navigation";

/**
 * Persistent, owner-bound Workshop records do not exist yet. The old route
 * echoed any URL segment as a Workshop title and implied that room data had
 * loaded. Fail honestly until a real record lookup and ownership check land.
 */
export default function BlueprintDetailPage() {
  notFound();
}
