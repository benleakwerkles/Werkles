export function describeWorkshopPressure(blockerAnswer: string): string {
  const named = blockerAnswer
    .split(";")
    .map((blocker) => blocker.trim())
    .filter(Boolean);

  if (named.length === 0) {
    return "Your intake does not name what is getting in the way yet.";
  }
  if (named.length === 1) {
    return `You named ${named[0]} as something getting in the way.`;
  }

  const readable = `${named.slice(0, -1).join(", ")}, and ${named.at(-1)}`;
  return `You named multiple things getting in the way: ${readable}. We should not pick one as the main bottleneck yet.`;
}
