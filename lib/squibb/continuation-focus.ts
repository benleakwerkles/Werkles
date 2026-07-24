type ContinuationEvent = {
  preventDefault: () => void;
};

type ContinuationTarget = {
  focus: (options?: FocusOptions) => void;
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
};

type FindContinuationTarget = (id: string) => ContinuationTarget | null;

export function followContinuationTarget(
  targetId: string | undefined,
  event: ContinuationEvent,
  findTarget: FindContinuationTarget = (id) => document.getElementById(id)
) {
  if (!targetId) return false;
  const target = findTarget(targetId);
  if (!target) return false;

  event.preventDefault();
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "auto", block: "nearest" });
  return true;
}
