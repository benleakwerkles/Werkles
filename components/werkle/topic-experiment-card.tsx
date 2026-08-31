import Link from "next/link";

import { topicExperimentFor } from "@/lib/werkle/topic-experiment";
import type { WerkleTopicId } from "@/lib/werkle/formation";

export function TopicExperimentCard({ topicId, label }: { topicId: WerkleTopicId; label: string }) {
  const experiment = topicExperimentFor(topicId);

  return (
    <aside className="werkle-topic-experiment" aria-label={`A practical way to explore ${label}`}>
      <div>
        <p className="workshop-eyebrow">{experiment.kind === "adviser_handoff" ? "Prepare a clean adviser handoff" : "Try this before the next conversation"}</p>
        <h3>{experiment.title}</h3>
      </div>
      <p><strong>Do:</strong> {experiment.prompt}</p>
      <p><strong>Bring back:</strong> {experiment.observe}</p>
      <div className="werkle-topic-experiment__actions">
        <Link href={experiment.bellowsHref}>Open the Conversation Guide</Link>
        {experiment.crucibleHref ? <Link href={experiment.crucibleHref}>Choose a Narrow Outside Check</Link> : null}
      </div>
      <small>This is a test shape, not an assignment or agreement. Both people decide what to try and what the result means.</small>
    </aside>
  );
}
