export type PacketBuildResult = {
  destination: string;
  packet: string;
};

function validateDestination(destination: string): void {
  if (!/^[A-Za-z][A-Za-z0-9_-]*@[A-Za-z][A-Za-z0-9_-]*$/.test(destination)) {
    throw new Error("Destination must be in Aeye@Machine form, e.g. Dink@Betsy.");
  }
}

function compactMission(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildPacket(destination: string, missionText: string): PacketBuildResult {
  const target = destination.trim();
  const mission = compactMission(missionText);

  validateDestination(target);
  if (!mission) {
    throw new Error("Mission text is required.");
  }

  const packet = [
    `TO: ${target}`,
    "FROM: OperatorAssist@Betsy",
    `CREATED_AT: ${new Date().toISOString()}`,
    "",
    "MISSION:",
    mission,
    "",
    "RULES:",
    "- No auto-send.",
    "- Act only within repo cockpit/doctrine gates.",
    "- No mule output: do not tell Ben to run commands for GREEN local work.",
    "- Create, run, and receipt the local action when authority is already granted.",
    "- Completion must return an executable artifact, shortcut, button, file, screenshot, clipboard proof, or receipt.",
    "- If human action is required, name the boundary and package the next step as a click-ready launcher or explicit human gate.",
    "- Return receipt with files changed, launcher paths, test artifacts, blockers, and next action."
  ].join("\n");

  return { destination: target, packet };
}
