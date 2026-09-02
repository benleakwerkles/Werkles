import { activateStoredSpeakerIntakeForOwner } from "../../lib/squibb/concierge-intake-storage.ts";

async function main() {
  const [ownerId, intakeId] = process.argv.slice(2);
  if (!ownerId || !intakeId) {
    throw new Error("Usage: activate-local-member-intake <ownerId> <intakeId>");
  }

  const activated = await activateStoredSpeakerIntakeForOwner(ownerId, intakeId);
  if (!activated) {
    throw new Error("The requested Intake is not owned by this local member.");
  }

  console.log(`Local member Intake activated: ${activated.stored.intakeId}`);
}

void main();
