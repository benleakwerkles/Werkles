export type ReadEvent = {
  event_type: "ReadEvent";
  artifact_id: string;
  reader: string;
  author?: string;
  timestamp?: string;
  proof?: unknown;
  verified?: boolean;
};

export type DerivedActionEvent = {
  event_type: "DerivedActionEvent";
  actor: string;
  source_artifact_id: string;
  derived_artifact?: string;
  timestamp?: string;
  proof?: unknown;
  verified?: boolean;
};

export type WriteEvent = {
  event_type: "WriteEvent";
  artifact_id: string;
  author: string;
  derived_from?: string;
  timestamp?: string;
  proof?: unknown;
  verified?: boolean;
};

export type CandidateInheritanceEvent = {
  artifact_id: string;
  reader: string;
  author: string;
  derived_artifact: string;
  confidence: number;
  missing_proof: string[];
};

type DetectorInput = {
  reads: ReadEvent[];
  derived_actions: DerivedActionEvent[];
  writes: WriteEvent[];
};

function hasProof(event: { proof?: unknown; verified?: boolean }) {
  return event.verified === true || event.proof !== undefined;
}

function clampConfidence(value: number) {
  return Math.max(0.05, Math.min(0.95, Number(value.toFixed(2))));
}

function candidateKey(candidate: CandidateInheritanceEvent) {
  return [
    candidate.artifact_id,
    candidate.reader,
    candidate.author,
    candidate.derived_artifact,
  ].join("::");
}

function scoreCandidate(input: {
  read: ReadEvent;
  action: DerivedActionEvent;
  write: WriteEvent;
  missingProof: string[];
}) {
  let score = 0.62;

  if (input.write.derived_from === input.read.artifact_id) score += 0.16;
  if (input.action.derived_artifact === input.write.artifact_id) score += 0.12;
  if (input.read.author && input.read.author !== input.write.author) score += 0.05;
  if (input.read.timestamp && input.action.timestamp && input.write.timestamp) score += 0.05;
  score -= input.missingProof.length * 0.05;

  return clampConfidence(score);
}

export function detectInheritanceEventCandidates(input: DetectorInput): CandidateInheritanceEvent[] {
  const candidates: CandidateInheritanceEvent[] = [];

  for (const read of input.reads) {
    for (const action of input.derived_actions) {
      if (action.actor !== read.reader) continue;
      if (action.source_artifact_id !== read.artifact_id) continue;

      for (const write of input.writes) {
        if (write.author !== read.reader) continue;
        if (action.derived_artifact && action.derived_artifact !== write.artifact_id) continue;
        if (write.derived_from && write.derived_from !== read.artifact_id) continue;

        const missingProof = [
          hasProof(read) ? "" : "read_event_proof",
          hasProof(action) ? "" : "derived_action_event_proof",
          hasProof(write) ? "" : "write_event_proof",
          read.author ? "" : "source_author",
        ].filter(Boolean);

        if (!missingProof.length) continue;

        candidates.push({
          artifact_id: read.artifact_id,
          reader: read.reader,
          author: read.author || "UNKNOWN",
          derived_artifact: write.artifact_id,
          confidence: scoreCandidate({ read, action, write, missingProof }),
          missing_proof: missingProof,
        });
      }
    }
  }

  const deduped = new Map<string, CandidateInheritanceEvent>();
  for (const candidate of candidates) {
    const key = candidateKey(candidate);
    const existing = deduped.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      deduped.set(key, candidate);
    }
  }

  return [...deduped.values()].sort((left, right) => right.confidence - left.confidence);
}
