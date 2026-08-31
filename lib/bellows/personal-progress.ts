export const PERSONAL_BELLOWS_PROGRESS_KEY = "werkles:bellows:personal-progress:v1";

export type PersonalBellowsProgress = Readonly<{
  version: 1;
  completedLessonSlugs: readonly string[];
}>;

export function personalBellowsProgressFrom(value: unknown): PersonalBellowsProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze({ version: 1, completedLessonSlugs: Object.freeze([]) });
  }
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || !Array.isArray(record.completedLessonSlugs) || record.completedLessonSlugs.length > 30) {
    return Object.freeze({ version: 1, completedLessonSlugs: Object.freeze([]) });
  }
  const slugs = record.completedLessonSlugs.filter(
    (slug): slug is string => typeof slug === "string" && /^[a-z0-9-]{1,80}$/.test(slug)
  );
  if (slugs.length !== record.completedLessonSlugs.length) {
    return Object.freeze({ version: 1, completedLessonSlugs: Object.freeze([]) });
  }
  return Object.freeze({ version: 1, completedLessonSlugs: Object.freeze([...new Set(slugs)]) });
}

export function updatePersonalBellowsProgress(
  current: PersonalBellowsProgress,
  lessonSlug: string,
  completed: boolean
): PersonalBellowsProgress {
  if (!/^[a-z0-9-]{1,80}$/.test(lessonSlug)) return current;
  const next = new Set(current.completedLessonSlugs);
  if (completed) next.add(lessonSlug);
  else next.delete(lessonSlug);
  return Object.freeze({ version: 1, completedLessonSlugs: Object.freeze([...next]) });
}
